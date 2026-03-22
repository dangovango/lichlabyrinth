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

    // 1. Add all fixed-position objects to occupied spaces first
    
    // Walls
    layout.walls.forEach(wall => occupiedSpaces.push({ x: wall.x, y: wall.y }));

    // Doors
    const roomDoors = roomDef.doors || [];
    roomDoors.forEach(door => {
        const dx = door.position ? door.position.x : door.x;
        const dy = door.position ? door.position.y : door.y;
        occupiedSpaces.push({ x: dx, y: dy });
    });

    // NPCs (Must be pre-placed with positions)
    let npcs = [];
    if (roomDef.npcs && roomDef.npcs.length > 0) {
        npcs = roomDef.npcs.map((n, idx) => {
            const rawX = n.position ? n.position.x : (n.x !== undefined ? n.x : 0);
            const rawY = n.position ? n.position.y : (n.y !== undefined ? n.y : 0);
            return {
                ...n,
                id: n.id || `npc-${idx}-${Date.now()}`,
                position: { 
                    x: Math.max(0, Math.min(6, rawX)), 
                    y: Math.max(0, Math.min(6, rawY)) 
                }
            };
        });
        npcs.forEach(n => occupiedSpaces.push(n.position));
    }

    // 2. Spawn enemies (either pre-placed or random)
    let enemies = [];
    const rawEnemies = roomDef.enemySpawns || roomDef.enemies || [];
    if (rawEnemies.length > 0) {
        const looksLikeSpawn = rawEnemies.some(e => e.count !== undefined || !e.position);
        if (looksLikeSpawn) {
            enemies = placeEnemies(rawEnemies, layout, occupiedSpaces);
        } else {
            enemies = rawEnemies.map((e, idx) => {
                const base = enemyTypes[e.type] || enemyTypes.goblin;
                // STRICT CLAMPING to 0-6 range to prevent world-coordinate bleed
                const rawX = e.position ? e.position.x : (e.x !== undefined ? e.x : 0);
                const rawY = e.position ? e.position.y : (e.y !== undefined ? e.y : 0);
                const clampedX = Math.max(0, Math.min(6, rawX));
                const clampedY = Math.max(0, Math.min(6, rawY));
                
                return {
                    ...base,
                    ...e,
                    id: e.id || `${e.type || 'orc'}-custom-${idx}-${Date.now()}`,
                    hp: e.hp !== undefined ? e.hp : base.hp,
                    maxHp: e.maxHp !== undefined ? e.maxHp : base.hp,
                    position: { x: clampedX, y: clampedY },
                    turnOrder: e.turnOrder || Math.random()
                };
            });
            enemies.forEach(e => {
                if (e.position) occupiedSpaces.push(e.position);
            });
        }
    }

    // 3. Spawn treasures (either pre-placed or random)
    let treasures = [];
    if (roomDef.treasures && roomDef.treasures.length > 0) {
        // If they look like spawn definitions (have 'count', 'type: random', or MISSING 'position'), use placeTreasures
        const looksLikeSpawn = roomDef.treasures.some(t => t.count !== undefined || t.type === 'random' || !t.position);
        if (looksLikeSpawn) {
            treasures = placeTreasures(roomDef.treasures, layout, occupiedSpaces);
        } else {
            // They are pre-placed objects
            treasures = roomDef.treasures.map((t, idx) => {
                // STRICT CLAMPING to 0-6 range
                const rawX = t.position ? t.position.x : (t.x !== undefined ? t.x : 0);
                const rawY = t.position ? t.position.y : (t.y !== undefined ? t.y : 0);
                const clampedX = Math.max(0, Math.min(6, rawX));
                const clampedY = Math.max(0, Math.min(6, rawY));

                return {
                    id: t.id || `treasure-custom-${idx}-${Date.now()}`,
                    ...t,
                    position: { x: clampedX, y: clampedY }
                };
            });
            treasures.forEach(t => {
                if (t.position) occupiedSpaces.push(t.position);
            });
        }
    }

    const puzzleObjects = placePuzzleObjects(roomDef.puzzleObjects, layout, occupiedSpaces);

    // 4. Initialize Discovery (Fog of War)
    const discovered = [];
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const tx = player.position.x + dx;
            const ty = player.position.y + dy;
            if (tx >= 0 && tx < layout.width && ty >= 0 && ty < layout.height) {
                discovered.push({ x: tx, y: ty });
            }
        }
    }

    return {
        id: roomDef.roomId,
        name: roomDef.name,
        coords: roomDef.coords,
        layout: layout,
        enemies: enemies,
        treasures: treasures,
        npcs: npcs,
        puzzleObjects: puzzleObjects,
        doors: roomDef.doors,
        discovered: discovered
    };
}

export function spawnWanderingMonster(gameState) {
    const { currentRoom, player } = gameState;
    const layout = currentRoom.layout;

    const occupiedSpaces = [{ x: player.position.x, y: player.position.y }];
    layout.walls.forEach(wall => occupiedSpaces.push({ x: wall.x, y: wall.y }));
    currentRoom.enemies.forEach(enemy => occupiedSpaces.push({ x: enemy.position.x, y: enemy.position.y }));
    if (currentRoom.npcs) {
        currentRoom.npcs.forEach(npc => occupiedSpaces.push({ x: npc.position.x, y: npc.position.y }));
    }

    const doors = currentRoom.doors || layout.doors || [];
    doors.forEach(door => {
        const dx = door.position ? door.position.x : door.x;
        const dy = door.position ? door.position.y : door.y;
        occupiedSpaces.push({ x: dx, y: dy });
    });

    const validPositions = [];
    currentRoom.discovered.forEach(pos => {
        const isOccupied = occupiedSpaces.some(occ => occ.x === pos.x && occ.y === pos.y);
        if (!isOccupied) {
            validPositions.push(pos);
        }
    });

    if (validPositions.length === 0) return null;

    const possibleTypes = ['goblin', 'skeleton', 'orc', 'ghost'];
    const selectedType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
    const baseEnemy = enemyTypes[selectedType];

    const position = validPositions[Math.floor(Math.random() * validPositions.length)];

    const newEnemy = {
        ...baseEnemy,
        id: `${selectedType}-wandering-${Math.random().toString(36).substr(2, 5)}`,
        hp: baseEnemy.hp,
        maxHp: baseEnemy.hp,
        position: { ...position },
        turnOrder: Math.random(),
        isWandering: true
    };

    currentRoom.enemies.push(newEnemy);
    
    if (!gameState.visualEffects) gameState.visualEffects = [];
    gameState.visualEffects.push({
        type: 'enemySpawn',
        targetId: newEnemy.id,
        amount: baseEnemy.emoji,
        position: { ...newEnemy.position },
        startTime: Date.now()
    });

    soundManager.playSpawn();
    return newEnemy;
}

export function spawnWanderingTreasure(gameState) {
    const { currentRoom, player } = gameState;
    const layout = currentRoom.layout;

    const occupiedSpaces = [{ x: player.position.x, y: player.position.y }];
    layout.walls.forEach(wall => occupiedSpaces.push({ x: wall.x, y: wall.y }));
    currentRoom.enemies.forEach(enemy => occupiedSpaces.push({ x: enemy.position.x, y: enemy.position.y }));
    currentRoom.treasures.forEach(treasure => occupiedSpaces.push({ x: treasure.position.x, y: treasure.position.y }));

    const position = getRandomPosition(layout, occupiedSpaces);
    if (!position) return null;

    const newTreasure = {
        id: `wandering-treasure-${Date.now()}`,
        type: 'gold',
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
            type: spawn.type,
            position: position,
            active: spawn.active || false,
            triggers: spawn.triggers || []
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

    layout.doors = layout.doors.map(d => ({
        ...d,
        x: d.position ? d.position.x : d.x,
        y: d.position ? d.position.y : d.y
    }));

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

        for (let i = 0; i < (spawn.count || 1); i++) {
            const position = (i === 0 && spawn.position) ? spawn.position : getRandomPosition(layout, occupiedSpaces);
            
            // Defensively clamp even random positions
            const clampedPos = {
                x: Math.max(0, Math.min(6, position.x)),
                y: Math.max(0, Math.min(6, position.y))
            };
            
            occupiedSpaces.push(clampedPos);

            enemies.push({
                ...baseEnemy,
                id: spawn.id || `${spawn.type}-${enemyIdCounter++}-${Date.now()}`,
                position: clampedPos,
                hp: baseEnemy.hp,
                maxHp: baseEnemy.hp,
                turnOrder: Math.random()
            });
        }
    });

    return enemies;
}

function placeTreasures(treasureSpawns, layout, occupiedSpaces) {
    const treasures = [];
    if (!treasureSpawns) return treasures;

    treasureSpawns.forEach(spawn => {
        const count = spawn.count || 1;
        for (let i = 0; i < count; i++) {
            const position = (i === 0 && spawn.position) ? spawn.position : getRandomPosition(layout, occupiedSpaces);
            
            const clampedPos = {
                x: Math.max(0, Math.min(6, position.x)),
                y: Math.max(0, Math.min(6, position.y))
            };
            
            occupiedSpaces.push(clampedPos);

            let finalType = spawn.type;
            if (finalType === 'random') {
                const types = ['gold', 'potion', 'weapon', 'energy_upgrade', 'hp_upgrade'];
                finalType = types[Math.floor(Math.random() * types.length)];
            }

            if (spawn.type === 'random' && Math.random() < 0.05) {
                finalType = 'trap';
            }
            
            treasures.push({
                id: spawn.id || `treasure-${treasureIdCounter++}`,
                type: finalType,
                position: clampedPos,
                ...(spawn.id && { itemId: spawn.id }),
                ...(spawn.name && { name: spawn.name }),
                ...(spawn.reward && { reward: spawn.reward })
            });
        }
    });
    return treasures;
}
