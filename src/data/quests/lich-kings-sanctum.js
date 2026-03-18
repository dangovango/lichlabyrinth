export default {
    questId: "lich-kings-sanctum",
    name: "V: The Lich King's Sanctum",
    description: "The final seal is broken. The Lich King awaits you on his throne of bone. Defeat him and claim the ultimate treasure of the underworld!",
    turnLimit: 60,
    playerStart: { x: 3, y: 0 },
    rooms: [
        {
            roomId: "sk-entrance",
            name: "The Final Threshold",
            coords: { x: 0, y: 0 },
            flavorText: "The air here is thick with the smell of ozone and decay. Huge iron chains hang from the ceiling, pulsing with dark energy.",
            enemySpawns: [{ type: "skeleton", count: 2 }],
            treasures: [{ type: "potion", count: 1 }],
            doors: [
                { x: 3, y: 0 }, // Exfiltration Door
                { x: 6, y: 3, leadsTo: "sk-hall" } // East
            ]
        },
        {
            roomId: "sk-hall",
            name: "Hall of Whispers",
            coords: { x: 1, y: 0 },
            flavorText: "Every shadow in this room seems to have eyes. The mournful sighs of a thousand trapped souls echo through the hall.",
            enemySpawns: [{ type: "skeleton", count: 2 }, { type: "ghost", count: 2 }],
            treasures: [{ type: "trap", count: 1 }],
            doors: [
                { x: 0, y: 3, leadsTo: "sk-entrance" }, // West back to start
                { x: 6, y: 3, leadsTo: "sk-throne" } // East to Boss
            ]
        },
        {
            roomId: "sk-throne",
            name: "The Bone Throne",
            coords: { x: 2, y: 0 },
            flavorText: "A massive throne of jagged bone dominates the room. The Lich King sits motionless, eyes glowing with unholy fire.",
            enemySpawns: [{ type: "lich", count: 1, hp: 20, attack: 5 }],
            npcs: [
                {
                    id: "lich-king-boss",
                    name: "The Lich King",
                    emoji: "🧙‍♂️",
                    position: { x: 3, y: 2 },
                    dialogue: [
                        "So... the little explorer finally arrives.",
                        "You've waded through my guards and solved my trinket-puzzles.",
                        "But here, your journey ends. Your soul will make a fine addition to my collection.",
                        "Die, mortal! And serve me in eternity!"
                    ]
                }
            ],
            treasures: [
                { type: "gold", count: 10, position: { x: 1, y: 1 } },
                { type: "gold", count: 10, position: { x: 5, y: 5 } },
                { type: "gold", count: 10, position: { x: 1, y: 5 } },
                { type: "gold", count: 10, position: { x: 5, y: 1 } }
            ],
            doors: [
                { x: 0, y: 3, leadsTo: "sk-hall" } // West back to Hall
            ]
        }
    ],
    winConditions: {
        defeatBoss: { enemyType: "lich", required: true },
        exfiltrate: { required: true }
    },
    victoryMessage: "The Lich King's fire has been extinguished! You breathe the fresh air of the surface once more, your pack heavy with his ancient treasures. You are a true Master Explorer!"
};
