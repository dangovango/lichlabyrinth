// src/game/gameState.js

import { loadPlayerData } from '../utils/persistence.js';

export const ACTION_COSTS = {
    MOVE: 1,
    FIGHT: 1,
    SEARCH: 1,
};

/**
 * Creates the initial game state object.
 * @param {object} quest - The quest definition object.
 * @returns {object} The initial gameState.
 */
export function getInitialState(quest) {
    const persistentPlayer = loadPlayerData();
    const initialAP = persistentPlayer.apTotal || 6;

    // Filter inventory to only keep non-key items if you want persistence, 
    // or clear it entirely for a fresh quest.
    // Let's clear quest-specific items (anything that isn't a permanent upgrade).
    const startingInventory = (persistentPlayer.inventory || []).filter(item => 
        !['golden-key', 'ancient-amulet', 'bastion-core', 'clockwork-heart'].includes(item.id)
    );

    return {
        player: {
            id: "hero",
            hp: persistentPlayer.maxHp, // Always start at max HP
            maxHp: persistentPlayer.maxHp,
            attack: persistentPlayer.attack,
            position: quest.playerStart || { x: 3, y: 0 },
            inventory: startingInventory,
            stats: {
                apTotal: initialAP,
                gold: persistentPlayer.gold || 0
            }
        },
        currentRoom: null,
        quest: {
            id: quest.questId,
            name: quest.name,
            victoryMessage: quest.victoryMessage || "You have completed the quest!",
            currentRoomIndex: 0,
            rooms: quest.rooms,
            winConditions: quest.winConditions || {},
            progress: {
                defeatBoss: false,
                reachRoom: false,
                // Initialize other win conditions here if they exist in the quest definition
            },
            turnsElapsed: 0,
            turnLimit: quest.turnLimit || null
        },
        turn: {
            round: 1,
            ap: initialAP,      // Current action points
            apTotal: initialAP,  // Maximum action points
            squaresMovedThisTurn: 0
        },
        gameStatus: "playing",
        message: "Welcome! Your journey continues.",
        visualEffects: [] // New array to hold temporary visual effects
    };
}