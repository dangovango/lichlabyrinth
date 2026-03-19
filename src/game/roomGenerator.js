// src/game/roomGenerator.js

import enemyTypes from '../data/enemies.js';
import { getRandomPosition } from '../utils/helpers.js';
import { DEFAULT_LOOT_TABLE } from '../data/lootTables.js';
import { soundManager } from '../utils/audio.js';

let treasureIdCounter = 0;

/**
 * Generates a complete room state based on a room definition.
 * @param {object} roomDef - The definition of the room from the quest file.
 * @param {object} player - The player object, to avoid spawning on the player.
 * @returns {object} The complete room state.
 */
export function generateRoom(roomDef, player) {
    const layout = generateLayout(roomDef.doors, roomDef.walls);
    const occupiedSpaces = [{ x: player.position.x, y: player.position.y }];

    // Add walls to occupied spaces so things don't spawn inside them
    layout.walls.forEach(wall => occupiedSpaces.push({ x: wall.x, y: wall.y }));

    // Support both spawn definitions (enemySpawns) and pre-placed objects (enemies)
    let enemies = [];
    if (roomDef.enemySpawns && roomDef.enemySpawns.length > 0) {
        enemies = placeEnemies(roomDef.enemySpawns, layout, occupiedSpaces);
    } else if (roomDef.enemies && roomDef.enemies.length > 0) {
        // If they are already placed (from editor), just use them but ensure IDs and state
        enemies = roomDef.enemies.map((e, idx) => ({
            ...enemyTypes[e.type],
            ...e,
            id: e.id || `${e.type}-custom-${idx}-${Date.now()}`,
            hp: e.hp !== undefined ? e.hp : enemyTypes[e.type].hp,
            maxHp: e.maxHp !== undefined ? e.maxHp : enemyTypes[e.type].hp,
            turnOrder: e.turnOrder || Math.random()
        }));
        // Add their positions to occupied spaces
        enemies.forEach(e => occupiedSpaces.push(e.position));
    }

    // Support both spawn definitions and pre-placed treasures
    let treasures = [];
    if (roomDef.treasures && roomDef.treasures.length > 0) {
        // If they look like spawn definitions (have 'count', 'type: random', or MISSING 'position'), use placeTreasures
        const looksLikeSpawn = roomDef.treasures.some(t => t.count !== undefined || t.type === 'random' || !t.position);
        if (looksLikeSpawn) {
            treasures = placeTreasures(roomDef.treasures, layout, occupiedSpaces);
        } else {
            // They are pre-placed objects
            treasures = roomDef.treasures.map((t, idx) => ({
                id: t.id || `treasure-custom-${idx}-${Date.now()}`,
                ...t
            }));
            treasures.forEach(t => {
                if (t.position) occupiedSpaces.push(t.position);
            });
        }
    }

    const puzzleObjects = placePuzzleObjects(roomDef.puzzleObjects, layout, occupiedSpaces);

    // Support for NPCs (Static interactive characters)
    let npcs = [];
    if (roomDef.npcs && roomDef.npcs.length > 0) {
        npcs = roomDef.npcs.map((n, idx) => ({
            id: n.id || `npc-${idx}-${Date.now()}`,
            ...n
        }));
        // NPCs occupy space
        npcs.forEach(n => occupiedSpaces.push(n.position));
    }

    return {
        id: roomDef.roomId,
        name: roomDef.name,
        coords: roomDef.coords, // Pass spatial coordinates
        layout: layout,
        enemies: enemies,
        treasures: treasures,
        npcs: npcs,
        puzzleObjects: puzzleObjects,
        doors: roomDef.doors, // Ensure custom doors are passed to the room state
        discovered: []
    };
}

export function spawnWanderingMonster(gameState) {
    const { currentRoom, player } = gameState;
    const layout = currentRoom.layout;

    // Calculate occupied spaces to avoid spawning on player, walls, or existing enemies
    const occupiedSpaces = [{ x: player.position.x, y: player.position.y }];
    layout.walls.forEach(wall => occupiedSpaces.push({ x: wall.x, y: wall.y }));
    currentRoom.enemies.forEach(enemy => occupiedSpaces.push({ x: enemy.position.x, y: enemy.position.y }));

    // Also avoid doors
    const doors = currentRoom.doors || layout.doors || [];
    doors.forEach(door => {
        const dx = door.position ? door.position.x : door.x;
        const dy = door.position ? door.position.y : door.y;
        occupiedSpaces.push({ x: dx, y: dy });
    });

    const possibleTypes = ['goblin', 'skeleton', 'orc', 'ghost'];
    const selectedType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
    const baseEnemy = enemyTypes[selectedType];

    const position = getRandomPosition(layout, occupiedSpaces);
    if (!position) return null; // No space to spawn

    const newEnemy = {
        ...baseEnemy,
        id: `${selectedType}-wandering-${Math.random().toString(36).substr(2, 5)}`,
        hp: baseEnemy.hp,
        maxHp: baseEnemy.hp,
        position: position,
        turnOrder: Math.random(),
        isWandering: true
    };

    currentRoom.enemies.push(newEnemy);
    
    // Add visual and audio feedback
    if (!gameState.visualEffects) gameState.visualEffects = [];
    gameState.visualEffects.push({ 
        type: 'enemySpawn', 
        targetId: newEnemy.id, 
        amount: newEnemy.emoji, 
        position: { ...newEnemy.position },
        startTime: Date.now() 
    });
    soundManager.playSpawn();

    return newEnemy;
}

export function spawnWanderingTreasure(gameState) {
    const { currentRoom, player } = gameState;
    const layout = currentRoom.layout;

    // Calculate occupied spaces
    const occupiedSpaces = [{ x: player.position.x, y: player.position.y }];
    layout.walls.forEach(wall => occupiedSpaces.push({ x: wall.x, y: wall.y }));
    currentRoom.enemies.forEach(enemy => occupiedSpaces.push({ x: enemy.position.x, y: enemy.position.y }));
    currentRoom.treasures.forEach(treasure => occupiedSpaces.push({ x: treasure.position.x, y: treasure.position.y }));

    const position = getRandomPosition(layout, occupiedSpaces);
    if (!position) return null;

    const newTreasure = {
        id: `wandering-treasure-${Date.now()}`,
        type: 'gold', // Basic reward for wandering loot
        position: position
    };

    currentRoom.treasures.push(newTreasure);
    return newTreasure;
}

function placePuzzleObjects(puzzleSpawns, layout, occupiedSpaces) {
    const puzzleObjects = [];
    if (!puzzleSpawns) return puzzleObjects;

    puzzleSpawns.forEach(spawn => {
        const position = spawn.position || getRandomPosition(layout, occupiedSpaces);
        occupiedSpaces.push(position);
        puzzleObjects.push({
            id: spawn.id || `puzzle-${Math.random().toString(36).substr(2, 9)}`,
            type: spawn.type, // 'plate'
            position: position,
            active: spawn.active || false,
            triggers: spawn.triggers || [] // ID of the door it opens
        });
    });
    return puzzleObjects;
}

function generateLayout(customDoors, customWalls) {
    const layout = {
        width: 7,
        height: 7,
        walls: customWalls || [],
        doors: customDoors || [
            { x: 3, y: 0 }, { x: 3, y: 6 },
            { x: 0, y: 3 }, { x: 6, y: 3 }
        ]
    };

    // Normalize doors for the renderer (ensure flat x, y properties exist)
    layout.doors = layout.doors.map(d => ({
        ...d,
        x: d.position ? d.position.x : d.x,
        y: d.position ? d.position.y : d.y
    }));

    // If walls are UNDEFINED (legacy quests), add default pillars.
    // If walls is an empty array [] (editor quests), don't add them.
    if (customWalls === undefined) {
        layout.walls = [
            { x: 2, y: 2 }, { x: 4, y: 2 },
            { x: 2, y: 4 }, { x: 4, y: 4 }
        ];
    }

    return layout;
}

function placeEnemies(enemySpawns, layout, occupiedSpaces) {
    const enemies = [];
    if (!enemySpawns) return enemies;
    let enemyIdCounter = 0;

    enemySpawns.forEach(spawn => {
        const baseEnemy = enemyTypes[spawn.type];
        if (!baseEnemy) return;

        for (let i = 0; i < spawn.count; i++) {
            // Support absolute position if provided, else random
            const position = (i === 0 && spawn.position) ? spawn.position : getRandomPosition(layout, occupiedSpaces);
            occupiedSpaces.push(position);
            
            enemies.push({
                ...baseEnemy,
                id: `${spawn.type}-${enemyIdCounter++}`,
                hp: baseEnemy.hp,
                maxHp: baseEnemy.hp,
                position: position,
                turnOrder: Math.random() // Assign a random turn order
            });
        }
    });
    return enemies;
}

function placeTreasures(treasureSpawns, layout, occupiedSpaces) {
    const treasures = [];
    if (!treasureSpawns) return treasures;

    const lootTable = DEFAULT_LOOT_TABLE;

    function getRandomLootType() {
        const totalWeight = lootTable.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        for (const item of lootTable) {
            if (random < item.weight) return item.type;
            random -= item.weight;
        }
        return 'gold';
    }

    treasureSpawns.forEach(spawn => {
        const count = spawn.count || 1;
        for (let i = 0; i < count; i++) {
            const position = (i === 0 && spawn.position) ? spawn.position : getRandomPosition(layout, occupiedSpaces);
            occupiedSpaces.push(position);
            
            let finalType = spawn.type;
            if (finalType === 'random') {
                finalType = getRandomLootType();
            }

            // 5% chance for ANY non-key-item chest to be a hidden trap
            if (finalType !== 'key-item' && Math.random() < 0.05) {
                finalType = 'trap';
            }
            
            treasures.push({
                id: spawn.id || `treasure-${treasureIdCounter++}`,
                type: finalType,
                position: position,
                ...(spawn.id && { itemId: spawn.id }),
                ...(spawn.name && { name: spawn.name })
            });
        }
    });
    return treasures;
}
