// src/game/questManager.js

import quests from '../data/quests/index.js';
import { generateRoom } from './roomGenerator.js';

export function loadQuest(questId) {
    const quest = quests[questId];
    if (!quest) throw new Error(`Quest with ID "${questId}" not found.`);
    console.log(`Loaded quest: ${quest.name}`);
    return quest;
}

export function initializeFirstRoom(gameState) {
    // Use a deep copy to prevent state corruption
    const newGameState = JSON.parse(JSON.stringify(gameState));
    
    const firstRoomDef = newGameState.quest.rooms[0];
    
    newGameState.currentRoom = generateRoom(firstRoomDef, newGameState.player);
    newGameState.quest.currentRoomIndex = 0;
    
    // Set flavor text message
    newGameState.message = firstRoomDef.flavorText || `You have entered the ${newGameState.currentRoom.name}.`;

    // Check if this starting room fulfills a reachRoom condition
    if (newGameState.quest.winConditions?.reachRoom && 
        newGameState.quest.winConditions.reachRoom.roomId === firstRoomDef.roomId) {
        newGameState.quest.progress.reachRoom = true;
    }

    return newGameState;
}
/**
 * Advances the player to the next room in the quest.
 * @param {object} gameState - The current game state.
 * @param {object} door - The door object used for exit.
 * @returns {object} The new game state for the next room.
 */
export function advanceToNextRoom(gameState, door) {
    const newGameState = JSON.parse(JSON.stringify(gameState));
    let targetRoomId = door.leadsTo;

    // Spatial navigation support:
    // If no explicit leadsTo, check if the room has coordinates and find the neighbor
    if (!targetRoomId && newGameState.currentRoom.coords) {
        const { x, y } = newGameState.currentRoom.coords;
        let targetCoords = { x, y };

        const doorX = door.position ? door.position.x : door.x;
        const doorY = door.position ? door.position.y : door.y;

        if (doorY === 0) targetCoords.y -= 1; // North
        else if (doorY === 6) targetCoords.y += 1; // South
        else if (doorX === 0) targetCoords.x -= 1; // West
        else if (doorX === 6) targetCoords.x += 1; // East

        const neighbor = newGameState.quest.rooms.find(r => 
            r.coords && r.coords.x === targetCoords.x && r.coords.y === targetCoords.y
        );
        if (neighbor) targetRoomId = neighbor.roomId;
    }

    // Fallback for linear progression if no explicit link (MVP behavior)
    if (!targetRoomId) {
        const currentIdx = newGameState.quest.currentRoomIndex;
        if (currentIdx + 1 < newGameState.quest.rooms.length) {
            targetRoomId = newGameState.quest.rooms[currentIdx + 1].roomId;
        }
    }

    if (!targetRoomId) {
        newGameState.message = "This door leads nowhere.";
        return newGameState;
    }

    const nextRoomIndex = newGameState.quest.rooms.findIndex(r => r.roomId === targetRoomId);

    if (nextRoomIndex === -1) {
        newGameState.message = `Error: Room with ID "${targetRoomId}" not found.`;
        return newGameState;
    }

    const nextRoomDef = newGameState.quest.rooms[nextRoomIndex];
    
    // Calculate new player position based on exit position
    const doorX = door.position ? door.position.x : door.x;
    const doorY = door.position ? door.position.y : door.y;

    let newPlayerX = doorX;
    let newPlayerY = doorY;

    if (doorY === 0) { // Exited top door
        newPlayerY = 6; // Enter at bottom
    } else if (doorY === 6) { // Exited bottom door
        newPlayerY = 0; // Enter at top
    } else if (doorX === 0) { // Exited left door
        newPlayerX = 6; // Enter at right
    } else if (doorX === 6) { // Exited right door
        newPlayerX = 0; // Enter at left
    }
    
    newGameState.player.position = { x: newPlayerX, y: newPlayerY };
    
    newGameState.currentRoom = generateRoom(nextRoomDef, newGameState.player);
    newGameState.quest.currentRoomIndex = nextRoomIndex;
    
    // --- Track Progress & Set Flavor Text ---
    if (newGameState.quest.winConditions?.reachRoom && 
        newGameState.quest.winConditions.reachRoom.roomId === nextRoomDef.roomId) {
        newGameState.quest.progress.reachRoom = true;
    }

    newGameState.message = nextRoomDef.flavorText || `You have entered the ${newGameState.currentRoom.name}.`;

    if (newGameState.currentRoom.enemies && newGameState.currentRoom.enemies.length > 0) {
        newGameState.message += " Defeat all enemies to unlock the exits!";
    }

    // Reset Action Points and visual effects for the new room
    newGameState.turn.ap = newGameState.turn.apTotal;
    newGameState.turn.squaresMovedThisTurn = 0;
    newGameState.visualEffects = [];

    // Check for win conditions after moving to the new room
    if (checkAllWinConditionsMet(newGameState)) {
        newGameState.gameStatus = "won";
        newGameState.message = newGameState.quest.victoryMessage || "You have completed the quest!";
    }

    return newGameState;
}

/**
 * Checks if all required win conditions for the quest are met.
 * @param {object} gameState - The current game state.
 * @returns {boolean} True if all required conditions are met, false otherwise.
 */
export function checkAllWinConditionsMet(gameState) {
    if (!gameState || !gameState.quest) return false;
    const { quest, player } = gameState;
    const winConditions = quest.winConditions || {};
    const progress = quest.progress || {};
    const { currentRoomIndex, rooms } = quest;

    let allMet = true;

    // 1. Defeat Boss
    if (winConditions.defeatBoss && winConditions.defeatBoss.required) {
        // Support either a generic flag OR a specific enemy type match
        const requiredType = winConditions.defeatBoss.enemyType;
        if (requiredType) {
            if (!progress.defeatedEnemies || !progress.defeatedEnemies.includes(requiredType)) {
                allMet = false;
            }
        } else if (!progress.defeatBoss) {
            allMet = false;
        }
    }

    // 2. Reach Room (Uses persistent progress flag)
    if (winConditions.reachRoom && winConditions.reachRoom.required) {
        if (!progress.reachRoom) {
            allMet = false;
        }
    }

    // 3. Collect Item
    if (winConditions.collectItem && winConditions.collectItem.required) {
        const requiredItemId = winConditions.collectItem.itemId;
        const hasItem = player.inventory.some(item => item.id === requiredItemId);
        if (!hasItem) {
            allMet = false;
        }
    }

    // 4. Monster Quota
    if (winConditions.monsterQuota && winConditions.monsterQuota.required) {
        const killCount = progress.killCount || 0;
        if (killCount < winConditions.monsterQuota.count) {
            allMet = false;
        }
    }

    // 5. Puzzle Solved (Combination of switches/plates)
    if (winConditions.puzzleSolved && winConditions.puzzleSolved.required) {
        const requiredIds = winConditions.puzzleSolved.requires;
        const allRequirementsMet = requiredIds.every(reqId => {
            for (const r of rooms) {
                if (r.puzzleObjects) {
                    const po = r.puzzleObjects.find(p => p.id === reqId);
                    if (po) return po.active;
                }
            }
            return false;
        });
        if (!allRequirementsMet) {
            allMet = false;
        }
    }

    // 6. Exfiltrate
    // In our new model, "Exfiltrate" is the FINAL step.
    // If it's required, we return false here because the actual win is triggered
    // by the EXIT action at the entrance, not by this general state check.
    if (winConditions.exfiltrate && winConditions.exfiltrate.required) {
        return false;
    }

    return allMet;
}
