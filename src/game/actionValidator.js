// src/game/actionValidator.js
import { ACTION_COSTS } from './gameState.js';

export function canMove(gameState) {
    const { player, turn } = gameState;
    return turn.ap >= ACTION_COSTS.MOVE;
}

export function canFight(gameState) {
    if (gameState.turn.ap < ACTION_COSTS.FIGHT) {
        return false;
    }
    return getAdjacentEnemies(gameState).length > 0;
}

export function canSearch(gameState) {
    if (gameState.turn.ap < ACTION_COSTS.SEARCH) {
        return false;
    }
    // You can search at any time now!
    return true;
}

export function canInteract(gameState) {
    if (gameState.turn.ap < ACTION_COSTS.SEARCH) { // Reuse SEARCH cost
        return false;
    }
    return getAdjacentNPCs(gameState).length > 0;
}

export function canExit(gameState) {
    const { player, currentRoom, quest } = gameState;
    if (!currentRoom) return false;
    
    // HIGH-VISIBILITY DEBUG LOG
    const livingEnemies = (currentRoom.enemies || []).filter(e => e.hp > 0);
    const doors = currentRoom.doors || (currentRoom.layout && currentRoom.layout.doors) || [];
    
    if (livingEnemies.length > 0) {
        console.warn(`[EXIT_BLOCKED] Room: ${currentRoom.name} | Enemies:`, livingEnemies.map(e => e.name));
        return false;
    }
    
    // Find the door exactly at the player's position
    const doorAtPlayer = doors.find(d => {
        const dx = d.position ? d.position.x : d.x;
        const dy = d.position ? d.position.y : d.y;
        return dx === player.position.x && dy === player.position.y;
    });

    if (!doorAtPlayer) return false;

    // --- SHARED RULE: Locked doors block all interactions ---
    if (doorAtPlayer.isLocked) return false;

    // --- CASE 0: Fake Door ---
    if (doorAtPlayer.isFake) {
        return true;
    }

    // --- CASE 1: Standard Transition Door ---
    if (doorAtPlayer.leadsTo) {
        return true;
    }

    // --- CASE 2: Quest Exit (Explicit isExit OR implicit exfiltration door) ---
    const isExfiltrationPoint = doorAtPlayer.isExit || !doorAtPlayer.leadsTo;
    
    if (isExfiltrationPoint) {
        // If it's an exit, we must check if all mandatory objectives are met
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

        return mandatoriesMet;
    }

    return false;
}

export function getAdjacentEnemies(gameState) {
    const { player, currentRoom } = gameState;
    if (!currentRoom || !currentRoom.enemies) return [];
    
    const adjacent = currentRoom.enemies.filter(enemy => {
        if (enemy.hp <= 0) return false;
        const ex = enemy.position ? enemy.position.x : -1;
        const ey = enemy.position ? enemy.position.y : -1;
        const dx = Math.abs(player.position.x - ex);
        const dy = Math.abs(player.position.y - ey);
        return dx <= 1 && dy <= 1 && (dx !== 0 || dy !== 0);
    });

    if (adjacent.length > 0) {
        console.warn("Adjacent enemies detected:", adjacent.map(e => `${e.name} at (${e.position.x},${e.position.y})`));
    }
    
    return adjacent;
}

// Helper function to find adjacent NPCs
export function getAdjacentNPCs(gameState) {
    const { player, currentRoom } = gameState;
    if (!currentRoom.npcs) return [];
    return currentRoom.npcs.filter(npc => {
        const dx = Math.abs(player.position.x - npc.position.x);
        const dy = Math.abs(player.position.y - npc.position.y);
        return (dx <= 1 && dy <= 1) && (dx !== 0 || dy !== 0);
    });
}

export function isPathBlocked(gameState, dx, dy) {
    const { player, currentRoom } = gameState;
    const targetX = player.position.x + dx;
    const targetY = player.position.y + dy;

    if (targetX < 0 || targetX >= currentRoom.layout.width || targetY < 0 || targetY >= currentRoom.layout.height) {
        return "You can't move off the edge of the room.";
    }
    const isWall = currentRoom.layout.walls.some(wall => wall.x === targetX && wall.y === targetY);
    if (isWall) {
        return "You can't move through a wall.";
    }
    const isEnemy = currentRoom.enemies.some(enemy => enemy.hp > 0 && enemy.position.x === targetX && enemy.position.y === targetY);
    if (isEnemy) {
        return "An enemy blocks your path.";
    }
    const isNPC = currentRoom.npcs?.some(npc => npc.position.x === targetX && npc.position.y === targetY);
    if (isNPC) {
        return "Someone is standing there.";
    }

    const doors = currentRoom.doors || (currentRoom.layout && currentRoom.layout.doors) || [];
    const doorAtTarget = doors.find(d => {
        const dX = d.position ? d.position.x : d.x;
        const dY = d.position ? d.position.y : d.y;
        return dX === targetX && dY === targetY;
    });

    if (doorAtTarget && doorAtTarget.isLocked) {
        return "The door is locked.";
    }

    return null; // Path is not blocked
}
