export default {
    questId: "quest-4",
    name: "The Chamber of Gears",
    description: "Solve the machine's puzzle and escape before the tomb collapses!",
    turnLimit: 30,
    playerStart: { x: 3, y: 0 },
    rooms: [
        {
            roomId: "gear-room-1",
            name: "The Entry Hall",
            coords: { x: 0, y: 0 },
            flavorText: "Dust falls from the ceiling as massive gears grind behind the stone walls.",
            enemySpawns: [{ type: "skeleton", count: 2 }],
            treasures: [{ type: "gold", count: 1 }],
            puzzleObjects: [
                { id: "switch-A", type: "switch", position: { x: 1, y: 1 } }
            ],
            doors: [
                { x: 3, y: 0 }, // Exfiltration Door
                { id: "gear-exit", x: 6, y: 3, isLocked: true, requires: ["switch-A", "switch-B"], leadsTo: "victory-vault" },
                { x: 0, y: 3, leadsTo: "gear-room-2" } // West to Gear Pit
            ]
        },
        {
            roomId: "gear-room-2",
            name: "The Gear Pit",
            coords: { x: -1, y: 0 },
            flavorText: "The smell of ancient grease fills the air. A massive vertical shaft drops into darkness.",
            enemySpawns: [{ type: "orc", count: 1 }],
            treasures: [{ type: "weapon", count: 1 }],
            puzzleObjects: [
                { id: "switch-B", type: "switch", position: { x: 5, y: 5 } }
            ],
            doors: [
                { x: 6, y: 3, leadsTo: "gear-room-1" } // East back to Entry Hall
            ]
        },
        {
            roomId: "victory-vault",
            name: "The Victory Vault",
            coords: { x: 1, y: 0 },
            flavorText: "The air here is still and cool. Golden light reflects off piles of ancient coins.",
            enemySpawns: [],
            treasures: [{ type: "gold", count: 5 }],
            doors: [
                { x: 0, y: 3, leadsTo: "gear-room-1" }
            ]
        }
    ],
    winConditions: {
        reachRoom: { required: true, roomId: "victory-vault" },
        exfiltrate: { required: true } // Must return to Entry Hall to win
    },
    victoryMessage: "The gears grind to a final, satisfying halt. You have mastered the machine and escaped with its secrets!"
};
