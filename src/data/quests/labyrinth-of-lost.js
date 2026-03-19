export default {
    questId: "labyrinth-of-lost",
    name: "II: Labyrinth of the Lost",
    description: "The Amulet guides you to a shifting maze. Somewhere within this labyrinth lies the Gate Key, the only object that can grant entry to the Lich's Bastion.",
    turnLimit: 30,
    playerStart: { x: 3, y: 0 },
    rooms: [
        {
            roomId: "start-node",
            name: "The Crossroads",
            coords: { x: 0, y: 0 },
            flavorText: "Four corridors meet here, but only two paths are open. The air is cold and carries the sound of distant, rhythmic drums.",
            enemySpawns: [{ type: "goblin", count: 1 }],
            treasures: [
                { type: "story-item", id: "elaras-compass", name: "Elara's Compass", position: { x: 1, y: 1 } },
                { type: "potion", count: 1 }
            ],
            npcs: [
                {
                    id: "lost-elara",
                    name: "Lost Soul Elara",
                    emoji: "👻",
                    position: { x: 5, y: 5 },
                    dialogue: [
                        "Don't let the walls fool you... they move when you aren't looking.",
                        "I tried to find the Gate Key once. Now I'm just part of the architecture.",
                        "There's a pressure plate in the garden to the east. It's the only way to open the hall to the south.",
                        "Take my compass. It didn't save me, but maybe it'll help you."
                    ]
                }
            ],
            doors: [
                { x: 3, y: 0 }, // Exfiltration Door
                { x: 6, y: 3, leadsTo: "statue-garden" }, // East
                { x: 3, y: 6, leadsTo: "echoing-hall" }  // South
            ]
        },
        {
            roomId: "statue-garden",
            name: "The Statue Garden",
            coords: { x: 1, y: 0 },
            flavorText: "Weathered statues of forgotten heroes stand in silent vigil. One statue appears to be resting on a large stone plate.",
            enemySpawns: [{ type: "ghost", count: 1 }],
            treasures: [{ type: "energy_upgrade", count: 1 }],
            doors: [
                { x: 0, y: 3, leadsTo: "start-node" } // West
            ],
            puzzleObjects: [
                { id: "plate-cross-room", type: "plate", position: { x: 3, y: 3 }, triggers: ["hall-exit-door"] }
            ]
        },
        {
            roomId: "echoing-hall",
            name: "The Echoing Hall",
            coords: { x: 0, y: 1 },
            flavorText: "Every step you take echoes loudly through the corridor. A heavy portcullis blocks the path to the east.",
            enemySpawns: [{ type: "skeleton", count: 2 }],
            doors: [
                { x: 3, y: 0, leadsTo: "start-node" }, // North
                { id: "hall-exit-door", x: 6, y: 3, isLocked: true, leadsTo: "boss-chamber" } // East
            ]
        },
        {
            roomId: "boss-chamber",
            name: "The Inner Sanctum",
            coords: { x: 1, y: 1 },
            flavorText: "The heart of the labyrinth. An Orc Warchief stands guard over a pedestal containing a jagged iron key.",
            enemySpawns: [{ type: "orc", count: 1, hp: 12, attack: 4 }], // Strengthened Orc
            treasures: [{ type: "key-item", id: "gate-key", name: "Gate Key", position: { x: 3, y: 3 } }],
            doors: [
                { x: 0, y: 3, leadsTo: "echoing-hall" } // West
            ]
        }
    ],
    winConditions: {
        collectItem: { itemId: "gate-key", required: true },
        exfiltrate: { required: true }
    },
    victoryMessage: "The Gate Key heavy in your hand, you leave the maze behind. The Bastion looms ahead, its mechanical locks waiting."
};
