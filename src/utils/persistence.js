// src/utils/persistence.js

const SAVE_KEY = 'heroquest_player_save';

export const DEFAULT_PLAYER_STATS = {
    hp: 12,
    maxHp: 12,
    attack: 2,
    apTotal: 6,
    gold: 0,
    inventory: [],
    completedQuests: []
};

/**
 * Saves the player's persistent data to localStorage.
 * @param {object} player - The player object from gameState.
 * @param {string} completedQuestId - Optional ID of a quest just completed.
 */
export function savePlayerData(player, completedQuestId = null) {
    const currentSave = loadPlayerData();
    
    const saveData = {
        hp: player.hp,
        maxHp: player.maxHp,
        attack: player.attack,
        apTotal: player.stats.apTotal || 6,
        gold: player.stats.gold || 0,
        inventory: player.inventory,
        completedQuests: currentSave.completedQuests
    };

    if (completedQuestId && !saveData.completedQuests.includes(completedQuestId)) {
        saveData.completedQuests.push(completedQuestId);
    }

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

/**
 * Loads the player's persistent data from localStorage.
 * @returns {object} The loaded player stats or defaults.
 */
export function loadPlayerData() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return { ...DEFAULT_PLAYER_STATS };
    
    try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all fields exist
        return { ...DEFAULT_PLAYER_STATS, ...parsed };
    } catch (e) {
        console.error("Failed to parse save data:", e);
        return { ...DEFAULT_PLAYER_STATS };
    }
}

/**
 * Resets the player's progress.
 */
export function clearPlayerData() {
    localStorage.removeItem(SAVE_KEY);
}
