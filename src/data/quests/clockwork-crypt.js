export default {
    questId: "clockwork-crypt",
    name: "III: The Clockwork Crypt",
    description: "The Bastion's gates are sealed by a massive mechanical lock. You must descend into the Clockwork Crypt and retrieve the Clockwork Heart to power the mechanism.",
    turnLimit: 20,
    playerStart: { x: 3, y: 0 },
    rooms: [
        {
            roomId: "bronze-vestibule",
            name: "Bronze Vestibule",
            coords: { x: 0, y: 0 },
            flavorText: "The walls are lined with slowly turning brass gears. A massive mechanical door to the south is sealed shut by two heavy iron deadbolts.",
            enemySpawns: [{ type: "skeleton", count: 1 }],
            treasures: [{ type: "potion", count: 1 }],
            doors: [
                { x: 3, y: 0 }, // Exfiltration Door
                { x: 0, y: 3, leadsTo: "left-wing" }, // West
                { x: 6, y: 3, leadsTo: "right-wing" }, // East
                { id: "heart-gate", x: 3, y: 6, isLocked: true, requires: ["lever-left", "lever-right"], leadsTo: "heart-chamber" } // South
            ]
        },
        {
            roomId: "left-wing",
            name: "The Left Wing",
            coords: { x: -1, y: 0 },
            flavorText: "Steam hisses from burst pipes. A rusted lever sits precariously over a pit of churning pistons.",
            enemySpawns: [{ type: "skeleton", count: 2 }],
            npcs: [
                {
                    id: "construct-7b",
                    name: "Construct 7-B",
                    emoji: "🤖",
                    position: { x: 5, y: 1 },
                    dialogue: [
                        "UNIT 7-B... FUNCTIONAL... BARELY.",
                        "THE LICH KING... STOLE THE HEART... THE CORE OF OUR BASTION.",
                        "HE USES IT... TO POWER HIS DARK... MAGICS.",
                        "PULL THE LEVERS... UNLOCK THE PATH... RETURN THE HEART TO THE SURFACE."
                    ]
                }
            ],
            puzzleObjects: [
                { id: "lever-left", type: "switch", position: { x: 1, y: 1 } }
            ],
            doors: [
                { x: 6, y: 3, leadsTo: "bronze-vestibule" }
            ]
        },
        {
            roomId: "right-wing",
            name: "The Right Wing",
            coords: { x: 1, y: 0 },
            flavorText: "The sound of grinding stone is deafening. An orc sentry stands guard over a glowing blue toggle switch.",
            enemySpawns: [{ type: "orc", count: 1 }],
            treasures: [{ type: "random", count: 2 }],
            puzzleObjects: [
                { id: "lever-right", type: "switch", position: { x: 5, y: 5 } }
            ],
            doors: [
                { x: 0, y: 3, leadsTo: "bronze-vestibule" }
            ]
        },
        {
            roomId: "heart-chamber",
            name: "The Heart Chamber",
            coords: { x: 0, y: 1 },
            flavorText: "A massive, beating clockwork heart pulses with golden energy. This is the key to the Bastion's deepest gates.",
            enemySpawns: [{ type: "ghost", count: 2 }],
            treasures: [{ type: "key-item", id: "clockwork-heart", name: "Clockwork Heart", position: { x: 3, y: 3 } }],
            doors: [
                { x: 3, y: 0, leadsTo: "bronze-vestibule" }
            ]
        }
    ],
    winConditions: {
        collectItem: { itemId: "clockwork-heart", required: true },
        exfiltrate: { required: true }
    },
    victoryMessage: "The beating Heart of the Crypt is yours! The Bastion's gates will finally yield to your will."
};
