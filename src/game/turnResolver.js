// src/game/turnResolver.js
import { executeEnemyMove, executeEnemyAttack } from './actionExecutor.js';
import { spawnWanderingMonster, spawnWanderingTreasure } from './roomGenerator.js';

/**
 * Resets the player's action points at the start of their turn.
 * @param {object} gameState The current game state.
 * @returns {object} The new game state with AP restored.
 */
function startPlayerTurn(gameState) {
    const newGameState = JSON.parse(JSON.stringify(gameState));
    // Use the potentially upgraded apTotal from player stats
    newGameState.turn.apTotal = newGameState.player.stats.apTotal || newGameState.turn.apTotal;
    newGameState.turn.ap = newGameState.turn.apTotal;
    newGameState.turn.squaresMovedThisTurn = 0;
    newGameState.quest.turnsElapsed += 1;

    // Check for turn limit failure
    if (newGameState.quest.turnLimit && newGameState.quest.turnsElapsed > newGameState.quest.turnLimit) {
        newGameState.gameStatus = 'lost';
        newGameState.message = "You took too long! The dungeon has sealed itself forever.";
        return newGameState;
    }

    const turnPrompt = " Your turn. What will you do?";
    const limitPrompt = newGameState.quest.turnLimit ? ` (${newGameState.quest.turnLimit - newGameState.quest.turnsElapsed} turns left)` : "";
    
    // Only add prompt if it's not already there or if message is generic
    if (!newGameState.message || newGameState.message === "Enemy Turn...") {
        newGameState.message = "Your turn. What will you do?" + limitPrompt;
    } else {
        newGameState.message += turnPrompt + limitPrompt;
    }
    
    return newGameState;
}

/**
 * Resolves the entire enemy phase and then starts the next player turn.
 * @param {object} gameState - The state after the player's action.
 * @returns {object} The state after all enemies have acted and AP is reset.
 */
export function endPlayerTurn(gameState) {
    let newGameState = JSON.parse(JSON.stringify(gameState));
    const previousMessage = newGameState.message;

    // 1. Threat Check: 10% chance for a wandering monster
    if (Math.random() < 0.10) {
        const spawned = spawnWanderingMonster(newGameState);
        if (spawned) {
            newGameState.message = (previousMessage ? previousMessage + " " : "") + `A ${spawned.name} ambushes you!`;
        }
    }

    // 2. Luck Check: 5% chance for a glint of light (Wandering Loot)
    if (Math.random() < 0.05) {
        const found = spawnWanderingTreasure(newGameState);
        if (found) {
            const lootMsg = "You notice a glint of light on the floor.";
            newGameState.message = (newGameState.message ? newGameState.message + " " : "") + lootMsg;
        }
    }

    const enemiesToAct = newGameState.currentRoom.enemies
        .filter(enemy => enemy.hp > 0)
        .sort((a, b) => a.turnOrder - b.turnOrder);

    if (enemiesToAct.length > 0) {
        newGameState.message = (newGameState.message ? newGameState.message + " " : "") + "The enemies advance!";
        for (const enemy of enemiesToAct) {
            if (newGameState.gameStatus !== 'playing') break;
            newGameState = executeEnemyMove(newGameState, enemy.id);
            newGameState = executeEnemyAttack(newGameState, enemy.id);
        }
    }

    // After all enemies have moved, start the player's next turn.
    return startPlayerTurn(newGameState);
}