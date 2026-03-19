// src/game/actionExecutor.js
import { getAdjacentEnemies } from './actionValidator.js';
import { findNextStep } from '../utils/helpers.js';
import { treasureTypes, applyTrap } from '../data/treasures.js';
import { advanceToNextRoom, checkAllWinConditionsMet } from './questManager.js';
import { ACTION_COSTS } from './gameState.js';
import { savePlayerData } from '../utils/persistence.js';
import { soundManager } from '../utils/audio.js';

function createVisualEffect(type, targetId, amount = null, position = null) {
    return { type, targetId, amount, position, startTime: Date.now() };
}

// --- Player Actions ---

export function executeMove(gameState, dx, dy) {
    const newGameState = JSON.parse(JSON.stringify(gameState));
    newGameState.player.position.x += dx;
    newGameState.player.position.y += dy;
    newGameState.turn.ap -= ACTION_COSTS.MOVE;
    newGameState.turn.squaresMovedThisTurn += 1;
    newGameState.message = `You move.`;

    // Check for puzzle objects (plates and switches)
    if (newGameState.currentRoom.puzzleObjects) {
        const { player, currentRoom, quest } = newGameState;
        currentRoom.puzzleObjects.forEach(obj => {
            if (obj.position.x === player.position.x && obj.position.y === player.position.y) {
                const persistentRoom = quest.rooms.find(r => r.roomId === currentRoom.id);
                const persistentObj = persistentRoom && persistentRoom.puzzleObjects ? persistentRoom.puzzleObjects.find(po => po.id === obj.id) : null;

                if (obj.type === 'plate') {
                    if (!obj.active) {
                        obj.active = true;
                        if (persistentObj) persistentObj.active = true;
                        newGameState.message = "You hear a heavy 'click' as you step on a pressure plate!";
                        handleTriggers(newGameState, obj.triggers);
                    }
                } else if (obj.type === 'switch') {
                    // Toggles every time you step on it
                    obj.active = !obj.active;
                    if (persistentObj) persistentObj.active = obj.active;
                    newGameState.message = `You flip the switch ${obj.active ? 'ON' : 'OFF'}.`;

                    // Switches re-evaluate the state of the whole quest/room
                    handleTriggers(newGameState, obj.triggers);
                }
            }
        });
    }

    return newGameState;
}

/**
 * Handles logic for unlocking doors based on triggered IDs or combination states.
 */
function handleTriggers(gameState, triggerIds) {
    const { quest, currentRoom } = gameState;
    let anyChange = false;

    // 1. Explicit Direct Triggers (for backward compatibility with simple plates)
    if (triggerIds && triggerIds.length > 0) {
        const triggerArray = Array.isArray(triggerIds) ? triggerIds : triggerIds.split(',').map(t => t.trim());
        quest.rooms.forEach(roomDef => {
            if (roomDef.doors) {
                roomDef.doors.forEach(door => {
                    if (triggerArray.includes(door.id) && door.isLocked) {
                        door.isLocked = false;
                        anyChange = true;
                        if (roomDef.roomId === currentRoom.id) {
                            const currentDoor = currentRoom.doors.find(d => d.id === door.id);
                            if (currentDoor) currentDoor.isLocked = false;
                        }
                    }
                });
            }
        });
    }

    // 2. Combination Logic (Check doors that have "requires" conditions)
    quest.rooms.forEach(roomDef => {
        if (roomDef.doors) {
            roomDef.doors.forEach(door => {
                if (door.requires && (Array.isArray(door.requires) ? door.requires.length > 0 : door.requires.length > 0)) {
                    const requiresArray = Array.isArray(door.requires) ? door.requires : door.requires.split(',').map(t => t.trim());
                    
                    // Check if all required puzzle objects are active
                    const allRequirementsMet = requiresArray.every(reqId => {
                        // Find the puzzle object in any room
                        for (const r of quest.rooms) {
                            if (r.puzzleObjects) {
                                const po = r.puzzleObjects.find(p => p.id === reqId);
                                if (po) return po.active;
                            }
                        }
                        return false;
                    });

                    // If requirements are met, unlock. If NOT met, re-lock (for switches)
                    if (allRequirementsMet && door.isLocked) {
                        door.isLocked = false;
                        anyChange = true;
                    } else if (!allRequirementsMet && !door.isLocked) {
                        door.isLocked = true;
                        anyChange = true;
                    }

                    // Update live room state if necessary
                    if (roomDef.roomId === currentRoom.id) {
                        const currentDoor = currentRoom.doors.find(d => d.id === door.id);
                        if (currentDoor) currentDoor.isLocked = door.isLocked;
                    }
                }
            });
        }
    });

    if (anyChange) {
        gameState.message += " You hear mechanisms shifting in the walls.";
        soundManager.playLatch();
        
        // Find doors in the current room that just changed and add a flash effect
        currentRoom.doors.forEach(door => {
            const dx = door.position ? door.position.x : door.x;
            const dy = door.position ? door.position.y : door.y;
            gameState.visualEffects.push(createVisualEffect('doorUnlock', door.id, null, { x: dx, y: dy }));
        });
    }
}

export function executeFight(gameState) {
    let newGameState = JSON.parse(JSON.stringify(gameState));
    const { player } = newGameState;
    const adjacentEnemies = getAdjacentEnemies(newGameState);

    if (adjacentEnemies.length === 0) {
        newGameState.message = "There are no enemies adjacent to you.";
        return newGameState;
    }

    // Direct reference to the enemy in the new state
    const enemy = adjacentEnemies[0];

    newGameState.turn.ap -= ACTION_COSTS.FIGHT;
    const playerDamage = player.attack;
    enemy.hp -= playerDamage;
    newGameState.message = `You attack the ${enemy.name} for ${playerDamage} damage.`;
    newGameState.visualEffects.push(createVisualEffect('damageNumber', enemy.id, `-${playerDamage}`, { ...enemy.position }));

    if (enemy.hp <= 0) {
        newGameState.message += ` The ${enemy.name} is defeated!`;
        newGameState.visualEffects.push(createVisualEffect('enemyDeath', enemy.id, enemy.emoji, { ...enemy.position }));
        soundManager.playDeath();

        // --- TRACK PROGRESS ---
        if (!newGameState.quest.progress.defeatedEnemies) {
            newGameState.quest.progress.defeatedEnemies = [];
        }
        newGameState.quest.progress.defeatedEnemies.push(enemy.type || enemy.name.toLowerCase());
        newGameState.quest.progress.killCount = (newGameState.quest.progress.killCount || 0) + 1;

        if (enemy.isBoss) {
            newGameState.quest.progress.defeatBoss = true;
        }

        newGameState.currentRoom.enemies = newGameState.currentRoom.enemies.filter(e => e.id !== enemy.id);

        // Check for boss defeat win condition
        const winConditions = newGameState.quest.winConditions;
        if (winConditions && winConditions.defeatBoss && winConditions.defeatBoss.required) {
            const defeatBossCondition = winConditions.defeatBoss;
            if (enemy.name.toLowerCase().includes(defeatBossCondition.enemyType.toLowerCase()) || 
                (enemy.type && enemy.type === defeatBossCondition.enemyType)) {
                newGameState.quest.progress.defeatBoss = true;
            }
        }
    }

    if (checkAllWinConditionsMet(newGameState)) {
        newGameState.gameStatus = "won";
        const victoryMsg = newGameState.quest.victoryMessage || "You have completed the quest!";
        newGameState.message = (newGameState.message ? newGameState.message + " " : "") + victoryMsg;
        savePlayerData(newGameState.player, newGameState.quest.id);
    }

    return newGameState;
}

export function executeInteract(gameState) {
    const newGameState = JSON.parse(JSON.stringify(gameState));
    const { player, currentRoom } = newGameState;

    // Find the NPC in the actual currentRoom state, not just the filtered list
    const adjacentNPCs = getAdjacentNPCs(newGameState);
    if (adjacentNPCs.length === 0) {
        newGameState.message = "There is no one here to talk to.";
        return newGameState;
    }

    // Get the first adjacent NPC
    const npcInfo = adjacentNPCs[0];
    const npc = currentRoom.npcs.find(n => n.id === npcInfo.id);

    newGameState.turn.ap -= ACTION_COSTS.SEARCH; // Re-use search cost for social interaction

    if (Array.isArray(npc.dialogue)) {
        if (npc.currentLineIndex === undefined) npc.currentLineIndex = 0;

        newGameState.message = `${npc.name}: "${npc.dialogue[npc.currentLineIndex]}"`;

        // Cycle to next line for next interaction
        npc.currentLineIndex = (npc.currentLineIndex + 1) % npc.dialogue.length;
    } else {
        newGameState.message = `${npc.name}: "${npc.dialogue}"`;
    }

    return newGameState;
}


export function getAdjacentNPCs(gameState) {
    const { player, currentRoom } = gameState;
    if (!currentRoom.npcs) return [];
    return currentRoom.npcs.filter(npc => {
        const dx = Math.abs(player.position.x - npc.position.x);
        const dy = Math.abs(player.position.y - npc.position.y);
        return (dx <= 1 && dy <= 1) && (dx !== 0 || dy !== 0);
    });
}

export function executeSearch(gameState) {
    let newGameState = JSON.parse(JSON.stringify(gameState));
    const { player, currentRoom } = newGameState;

    newGameState.turn.ap -= ACTION_COSTS.SEARCH;
    const treasureIndex = currentRoom.treasures.findIndex(t => t.position.x === player.position.x && t.position.y === player.position.y);

    if (treasureIndex === -1) {
        newGameState.message = "You search the area but find nothing.";
    } else {
        const treasure = currentRoom.treasures[treasureIndex];

        // 1. Check if the treasure is an explicit TRAP or if we rolled a random trap
        if (treasure.type === 'trap' || Math.random() < 0.10) {
            const trapResult = applyTrap(player);
            newGameState.message = trapResult.message;
            newGameState.visualEffects.push(createVisualEffect('damageNumber', player.id, `-${trapResult.damage}`, player.position));
            newGameState.visualEffects.push(createVisualEffect('flash', player.id));

            if (player.hp <= 0) {
                player.hp = 0;
                newGameState.gameStatus = "lost";
                newGameState.message += " You have succumbed to your injuries.";
            }
        } else {
            // 2. Apply normal treasure reward
            const reward = treasureTypes[treasure.type];
            if (reward) {
                const result = reward.apply(player, treasure);
                newGameState.message = result.message;

                // Trigger visual effect if there was healing
                if (result.heal > 0) {
                    newGameState.visualEffects.push(createVisualEffect('damageNumber', player.id, `+${result.heal}`, player.position));
                }

                // NEW: Trigger a grand 'powerUp' effect for permanent upgrades
                if (treasure.type === 'weapon' || treasure.type === 'energy_upgrade' || treasure.type === 'hp_upgrade') {
                    newGameState.visualEffects.push(createVisualEffect('powerUp', player.id, treasure.type, player.position));
                }
            } else {
                newGameState.message = `You found a mysterious ${treasure.type}, but it seems to have no effect.`;
            }
        }
        currentRoom.treasures.splice(treasureIndex, 1);

        // Check for win conditions (e.g. collecting a key item)
        if (checkAllWinConditionsMet(newGameState)) {
            newGameState.gameStatus = "won";
            const victoryMsg = newGameState.quest.victoryMessage || "You have completed the quest!";
            newGameState.message = (newGameState.message ? newGameState.message + " " : "") + victoryMsg;
            savePlayerData(newGameState.player, newGameState.quest.id);
        }
    }
    return newGameState;
}

export function executeExit(gameState) {
    const { player, currentRoom, quest } = gameState;
    if (currentRoom.enemies.length > 0) {
        const newGameState = JSON.parse(JSON.stringify(gameState));
        newGameState.message = "You cannot exit while enemies are present.";
        return newGameState;
    }

    // Find the door exactly at the player's position
    const doors = currentRoom.doors || currentRoom.layout.doors || [];
    const doorAtPlayer = doors.find(d => {
        const dx = d.position ? d.position.x : d.x;
        const dy = d.position ? d.position.y : d.y;
        return dx === player.position.x && dy === player.position.y;
    });

    if (!doorAtPlayer) {
        const newGameState = JSON.parse(JSON.stringify(gameState));
        newGameState.message = "There is no connected door here.";
        return newGameState;
    }

    // --- SHARED RULE: Locked doors cannot be used ---
    if (doorAtPlayer.isLocked) {
        const newGameState = JSON.parse(JSON.stringify(gameState));
        newGameState.message = "The door is locked securely.";
        return newGameState;
    }

    // --- CASE 0: Fake Door ---
    if (doorAtPlayer.isFake) {
        soundManager.playLatch();
        const newGameState = JSON.parse(JSON.stringify(gameState));
        newGameState.message = doorAtPlayer.customMessage || "The door is just a clever imitation. It leads nowhere.";
        
        if (doorAtPlayer.trapDamage) {
            player.hp -= doorAtPlayer.trapDamage;
            newGameState.player.hp = player.hp;
            newGameState.message += ` It was booby-trapped! You take ${doorAtPlayer.trapDamage} damage.`;
            newGameState.visualEffects.push(createVisualEffect('damageNumber', player.id, `-${doorAtPlayer.trapDamage}`, player.position));
            newGameState.visualEffects.push(createVisualEffect('flash', player.id));

            if (newGameState.player.hp <= 0) {
                newGameState.player.hp = 0;
                newGameState.gameStatus = "lost";
                newGameState.message += " The trap was fatal.";
            }
        }
        return newGameState;
    }

    // --- CASE 1: Standard Transition Door ---
    if (doorAtPlayer.leadsTo) {
        const nextGameState = advanceToNextRoom(gameState, doorAtPlayer);
        if (nextGameState.gameStatus === 'won') {
            savePlayerData(nextGameState.player, nextGameState.quest.id);
        }
        return nextGameState;
    }

    // --- CASE 2: Quest Exit (Explicit isExit OR implicit exfiltration door) ---
    const isExfiltrationPoint = doorAtPlayer.isExit || !doorAtPlayer.leadsTo;

    if (isExfiltrationPoint) {
        // Check if all MANDATORY objectives are finished first
        const winConditions = quest.winConditions || {};
        const progress = quest.progress || {};
        let mandatoriesMet = true;

        if (winConditions.defeatBoss?.required && !progress.defeatBoss) mandatoriesMet = false;
        if (winConditions.reachRoom?.required && !progress.reachRoom) mandatoriesMet = false;
        if (winConditions.collectItem?.required) {
            const hasItem = player.inventory.some(item => item.id === winConditions.collectItem.itemId);
            if (!hasItem) mandatoriesMet = false;
        }
        if (winConditions.monsterQuota?.required) {
            const killCount = progress.killCount || 0;
            if (killCount < winConditions.monsterQuota.count) mandatoriesMet = false;
        }
        if (winConditions.puzzleSolved?.required) {
            const requiredIds = winConditions.puzzleSolved.requires;
            const allActive = requiredIds.every(reqId => {
                for (const r of quest.rooms) {
                    if (r.puzzleObjects) {
                        const po = r.puzzleObjects.find(p => p.id === reqId);
                        if (po) return po.active;
                    }
                }
                return false;
            });
            if (!allActive) mandatoriesMet = false;
        }

        if (mandatoriesMet) {
            const newGameState = JSON.parse(JSON.stringify(gameState));
            newGameState.gameStatus = "won";
            newGameState.message = quest.victoryMessage || "You have escaped the dungeon! Victory!";
            savePlayerData(newGameState.player, newGameState.quest.id);
            return newGameState;
        } else {
            const newGameState = JSON.parse(JSON.stringify(gameState));
            newGameState.message = "The exit is barred until your mission is complete!";
            return newGameState;
        }
    }

    const newGameState = JSON.parse(JSON.stringify(gameState));
    newGameState.message = "This door seems to lead nowhere.";
    return newGameState;
}

// --- Enemy Actions ---

export function executeEnemyMove(gameState, enemyId) {
    const newGameState = JSON.parse(JSON.stringify(gameState));
    const enemy = newGameState.currentRoom.enemies.find(e => e.id === enemyId);
    if (!enemy) return newGameState;

    const { player, currentRoom } = newGameState;
    const otherActors = [...currentRoom.enemies.filter(e => e.id !== enemyId), player];

    let movedDistance = 0;
    while (movedDistance < enemy.movementRange) {
        const currentPos = enemy.position;
        const nextPos = findNextStep(currentPos, player.position, currentRoom.layout, currentRoom.layout.walls, otherActors);
        if (nextPos.x === currentPos.x && nextPos.y === currentPos.y) break;
        enemy.position = nextPos;
        movedDistance++;
    }
    return newGameState;
}

export function executeEnemyAttack(gameState, enemyId) {
    const newGameState = JSON.parse(JSON.stringify(gameState));
    const enemy = newGameState.currentRoom.enemies.find(e => e.id === enemyId);
    if (!enemy) return newGameState;

    const { player } = newGameState;
    const isAdjacent = Math.abs(player.position.x - enemy.position.x) <= 1 && Math.abs(player.position.y - enemy.position.y) <= 1;

    if (isAdjacent) {
        const enemyDamage = enemy.attack;
        player.hp -= enemyDamage;
        newGameState.message += ` The ${enemy.name} attacks you for ${enemyDamage} damage.`;
        newGameState.visualEffects.push(createVisualEffect('damageNumber', player.id, `-${enemyDamage}`, player.position));
        newGameState.visualEffects.push(createVisualEffect('flash', player.id));

        if (player.hp <= 0) {
            player.hp = 0;
            newGameState.gameStatus = "lost";
            newGameState.message += " You have been defeated. Game Over.";
        }
    }
    return newGameState;
}
