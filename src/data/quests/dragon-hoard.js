export default {
    questId: "dragon-hoard",
    name: "The Dragon's Hoard",
    description: "A fearsome dragon has taken up residence in the old keep. Slay it, seize the key, and escape before the structure crumbles.",
    turnLimit: 25,
    playerStart: { x: 3, y: 0 },
    rooms: [
        {
            roomId: "entrance-hall",
            name: "Entrance Hall",
            coords: { x: 0, y: 0 },
            flavorText: "The heavy oak doors slam shut behind you. The air is thick with the scent of sulfur and old decay.",
            enemySpawns: [{ type: "goblin", count: 3 }],
            treasures: [{ type: "potion", count: 1 }],
            doors: [
                { x: 3, y: 0 }, // Exfiltration Door (No leadsTo)
                { x: 6, y: 3, leadsTo: "corridor" } // East to Corridor
            ]
        },
        {
            roomId: "corridor",
            name: "Corridor",
            coords: { x: 1, y: 0 },
            flavorText: "Long shadows stretch across the floor. You hear the faint scratching of claws against stone.",
            enemySpawns: [{ type: "ghost", count: 2 }],
            treasures: [{ type: "random", count: 1 }],
            doors: [
                { x: 0, y: 3, leadsTo: "entrance-hall" }, // West back to Start
                { x: 6, y: 3, leadsTo: "treasury" } // East to Treasury
            ]
        },
        {
            roomId: "treasury",
            name: "Treasury",
            coords: { x: 2, y: 0 },
            flavorText: "Empty chests line the walls, looted long ago. But wait... is that a glint of gold in the corner?",
            enemySpawns: [{ type: "goblin", count: 2 }, { type: "orc", count: 1 }],
            treasures: [{ type: "random", count: 2 }],
            doors: [
                { x: 0, y: 3, leadsTo: "corridor" }, // West back to Corridor
                { x: 6, y: 3, leadsTo: "boss-room" } // East to Dragon
            ]
        },
        {
            roomId: "boss-room",
            name: "Boss Room",
            coords: { x: 3, y: 0 },
            flavorText: "The heat is intense. A massive pile of gold glitters in the center, guarded by a sleeping behemoth.",
            enemySpawns: [{ type: "dragon", count: 1 }],
            treasures: [{ type: "key-item", id: "golden-key", name: "Golden Key" }],
            doors: [
                { x: 0, y: 3, leadsTo: "treasury" } // West back to Treasury
            ]
        }
    ],
    winConditions: {
        defeatBoss: { enemyType: "dragon", required: true },
        collectItem: { itemId: "golden-key", required: true },
        exfiltrate: { required: true }
    },
    victoryMessage: "With the Golden Key in hand and the Dragon slain, you escape the crumbling keep as a true legend!"
};
