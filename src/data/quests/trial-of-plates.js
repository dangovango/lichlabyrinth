export default {
    questId: "trial-of-plates",
    name: "The Trial of the Plates",
    description: "An ancient mechanism blocks the path. Solve the puzzle to reach the vault, and return to the start to prove your worth.",
    turnLimit: 12,
    playerStart: { x: 3, y: 0 },
    rooms: [
        {
            roomId: "puzzle-room",
            name: "The Puzzle Chamber",
            coords: { x: 0, y: 0 },
            flavorText: "The stone walls are perfectly smooth, save for a single heavy plate embedded in the floor. A massive iron gate blocks the path to the north.",
            enemySpawns: [{ type: "goblin", count: 1 }],
            treasures: [{ type: "potion", count: 1 }],
            doors: [
                { x: 3, y: 0 }, // Exfiltration Door
                { id: "exit-door", x: 6, y: 3, isLocked: true, leadsTo: "reward-room" } // Moved from 3,0 to 6,3
            ],
            puzzleObjects: [
                { id: "plate-1", type: "plate", position: { x: 5, y: 5 }, triggers: ["exit-door"] }
            ]
        },
        {
            roomId: "reward-room",
            name: "The Reward Vault",
            coords: { x: 1, y: 0 },
            flavorText: "The room is bathed in a golden glow from the treasures within. The air is warm and smells of ancient magic.",
            enemySpawns: [],
            treasures: [{ type: "weapon", count: 1 }],
            doors: [
                { x: 0, y: 3, leadsTo: "puzzle-room" }
            ]
        }
    ],
    winConditions: {
        reachRoom: { roomId: "reward-room", required: true },
        exfiltrate: { required: true }
    },
    victoryMessage: "The trial is complete. You have proven both your logic and your speed!"
};
