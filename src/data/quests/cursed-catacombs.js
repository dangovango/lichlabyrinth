export default {
    questId: "cursed-catacombs",
    name: "I: The Cursed Catacombs",
    description: "Your journey begins at the edge of the Frozen Wastes. Somewhere within these ancient catacombs lies the Ancient Amulet, the only key to the Lich King's domain.",
    turnLimit: 50,
    playerStart: { x: 3, y: 0 }, 
    rooms: [
        {
            roomId: "catacomb-entrance",
            name: "Catacomb Entrance",
            coords: { x: 0, y: 0 },
            flavorText: "The air is stagnant and smells of dry earth. To the south, a narrow stone staircase descends into the dark.",
            enemySpawns: [{ type: "skeleton", count: 1 }],
            treasures: [
                { type: "story-item", id: "silas-notes", name: "Silas's Notes", position: { x: 1, y: 5 } },
                { type: "potion", count: 1 }
            ],
            npcs: [
                {
                    id: "hermit-silas",
                    name: "Old Hermit Silas",
                    emoji: "🧙",
                    position: { x: 5, y: 1 },
                    dialogue: [
                        "Who goes there? A living soul? In this gods-forsaken place?",
                        "If you seek the Lich King's hoard, you'll need more than just courage.",
                        "The fortress is barred by Soul-Binding Wards. Only the Ancient Amulet can break them.",
                        "I've left my notes by the stairs. They might help you find it... if the skeletons don't find you first."
                    ]
                }
            ],
            doors: [
                { x: 3, y: 0 }, // The Entrance/Exfiltration point
                { x: 3, y: 6, leadsTo: "bone-hall" } // South to deeper dungeon
            ]
        },
        {
            roomId: "bone-hall",
            name: "Hall of Bones",
            coords: { x: 0, y: 1 },
            flavorText: "The walls here are built from thousands of interlocking skulls. Their empty sockets seem to watch your every move.",
            enemySpawns: [{ type: "skeleton", count: 3 }, { type: "ghost", count: 1 }],
            treasures: [{ type: "hp_upgrade", count: 1 }],
            doors: [
                { x: 3, y: 0, leadsTo: "catacomb-entrance" }, // North back to start
                { x: 3, y: 6, leadsTo: "lich-tomb" } // South to Boss
            ]
        },
        {
            roomId: "lich-tomb",
            name: "The First Guardian's Tomb",
            coords: { x: 0, y: 2 },
            flavorText: "An ornate sarcophagus sits at the center of this frigid chamber. The Ancient Amulet rests upon a pedestal of black ice.",
            enemySpawns: [{ type: "skeleton", count: 4 }, { type: "orc", count: 1 }],
            treasures: [{ type: "key-item", id: "ancient-amulet", name: "Ancient Amulet", position: { x: 3, y: 3 } }],
            doors: [
                { x: 3, y: 0, leadsTo: "bone-hall" } // North back to Hall
            ]
        }
    ],
    winConditions: {
        collectItem: { itemId: "ancient-amulet", required: true },
        exfiltrate: { required: true }
    },
    victoryMessage: "You emerge from the shadows, clutching the pulsing Ancient Amulet. It glows with a spectral light, pointing toward the Labyrinth of the Lost."
};
