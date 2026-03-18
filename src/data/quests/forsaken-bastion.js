export default {
    questId: "forsaken-bastion",
    name: "IV: The Forsaken Bastion",
    description: "The gates groan open. You are inside the Lich King's primary fortress. You must fight your way to the lower levels and defeat the Dragon Guardian to obtain the Lich Seal.",
    turnLimit: 180,
    playerStart: { x: 3, y: 0 },
    rooms: [
        {
            roomId: "bastion-0-0",
            name: "The Grand Entrance",
            coords: { x: 0, y: 0 },
            flavorText: "Huge stone pillars support a vaulted ceiling. To the east lies the soldiers' quarters; to the south, the lower corridors.",
            enemySpawns: [{ type: "goblin", count: 2 }],
            treasures: [{ type: "potion", count: 1 }],
            doors: [
                { x: 3, y: 0 }, // Exfiltration Door
                { x: 6, y: 3, leadsTo: "bastion-1-0" },
                { x: 3, y: 6, leadsTo: "bastion-0-1" }
            ]
        },
        {
            roomId: "bastion-1-0",
            name: "Soldier's Barracks",
            coords: { x: 1, y: 0 },
            flavorText: "Rusted bunks and rotting straw mattresses litter the room. The scent of unwashed goblins is strong here.",
            enemySpawns: [{ type: "goblin", count: 3 }],
            doors: [
                { x: 0, y: 3, leadsTo: "bastion-0-0" },
                { x: 6, y: 3, leadsTo: "bastion-2-0" },
                { x: 3, y: 6, leadsTo: "bastion-1-1" }
            ]
        },
        {
            roomId: "bastion-2-0",
            name: "Armory",
            coords: { x: 2, y: 0 },
            flavorText: "Racks of shattered shields and dull blades line the walls. Somewhere in the debris, something still glitters.",
            enemySpawns: [{ type: "orc", count: 1 }],
            treasures: [{ type: "weapon", count: 1 }],
            doors: [
                { x: 0, y: 3, leadsTo: "bastion-1-0" },
                { x: 6, y: 3, leadsTo: "bastion-3-0" },
                { x: 3, y: 6, leadsTo: "bastion-2-1" }
            ]
        },
        {
            roomId: "bastion-3-0",
            name: "Mess Hall",
            coords: { x: 3, y: 0 },
            flavorText: "Large wooden tables have been overturned to form crude barricades. A group of goblins is fighting over a piece of charred meat.",
            enemySpawns: [{ type: "goblin", count: 4 }],
            doors: [
                { x: 0, y: 3, leadsTo: "bastion-2-0" },
                { x: 6, y: 3, leadsTo: "bastion-4-0" },
                { x: 3, y: 6, leadsTo: "bastion-3-1" }
            ]
        },
        {
            roomId: "bastion-4-0",
            name: "The Plate Gallery",
            coords: { x: 4, y: 0 },
            flavorText: "Dusty portraits of the Bastion's former lords hang here. One tile in the floor is slightly raised, marked with a faint engraving.",
            enemySpawns: [{ type: "ghost", count: 1 }],
            doors: [
                { x: 0, y: 3, leadsTo: "bastion-3-0" },
                { x: 3, y: 6, leadsTo: "bastion-4-1" }
            ],
            puzzleObjects: [
                {
                    id: "plate-1",
                    type: "plate",
                    position: { x: 3, y: 3 },
                    active: false,
                    triggers: ["bastion-door-0-1-S"]
                }
            ]
        },
        {
            roomId: "bastion-0-1",
            name: "The Locked Corridor",
            coords: { x: 0, y: 1 },
            flavorText: "A long, dark hallway. A heavy portcullis to the south blocks the way to the deeper cellars.",
            enemySpawns: [{ type: "goblin", count: 2 }],
            doors: [
                { x: 3, y: 0, leadsTo: "bastion-0-0" },
                { x: 6, y: 3, leadsTo: "bastion-1-1" },
                { id: "bastion-door-0-1-S", x: 3, y: 6, isLocked: true, leadsTo: "bastion-0-2" }
            ]
        },
        {
            roomId: "bastion-1-1",
            name: "Guard Post",
            coords: { x: 1, y: 1 },
            flavorText: "The smell of old blood and oil lingers. Murder holes in the ceiling suggest this was a deadly bottleneck.",
            enemySpawns: [{ type: "orc", count: 2 }],
            doors: [
                { x: 0, y: 3, leadsTo: "bastion-0-1" },
                { x: 3, y: 0, leadsTo: "bastion-1-0" },
                { x: 6, y: 3, leadsTo: "bastion-2-1" },
                { x: 3, y: 6, leadsTo: "bastion-1-2" }
            ]
        },
        {
            roomId: "bastion-2-1",
            name: "Torture Chamber",
            coords: { x: 2, y: 1 },
            flavorText: "Iron maidens and racks stand as grim reminders of the Bastion's darker days. A ghostly moan echoes from the walls.",
            enemySpawns: [{ type: "goblin", count: 3 }],
            treasures: [{ type: "trap", count: 1 }],
            doors: [
                { x: 0, y: 3, leadsTo: "bastion-1-1" },
                { x: 3, y: 0, leadsTo: "bastion-2-0" },
                { x: 6, y: 3, leadsTo: "bastion-3-1" },
                { x: 3, y: 6, leadsTo: "bastion-2-2" }
            ]
        },
        {
            roomId: "bastion-3-1",
            name: "Archives",
            coords: { x: 3, y: 1 },
            flavorText: "Stacks of moldy scrolls and decaying books fill the shelves. Someone was searching for something here recently.",
            enemySpawns: [{ type: "orc", count: 1 }],
            treasures: [{ type: "potion", count: 1 }],
            doors: [
                { x: 0, y: 3, leadsTo: "bastion-2-1" },
                { x: 3, y: 0, leadsTo: "bastion-3-0" },
                { x: 6, y: 3, leadsTo: "bastion-4-1" },
                { x: 3, y: 6, leadsTo: "bastion-3-2" }
            ]
        },
        {
            roomId: "bastion-4-1",
            name: "The Hidden Workshop",
            coords: { x: 4, y: 1 },
            flavorText: "Tools for fine mechanical work sit on a workbench. A strange lever is embedded in the wall behind a bookcase.",
            enemySpawns: [{ type: "ghost", count: 2 }],
            doors: [
                { x: 0, y: 3, leadsTo: "bastion-3-1" },
                { x: 3, y: 0, leadsTo: "bastion-4-0" },
                { x: 3, y: 6, leadsTo: "bastion-4-2" }
            ],
            puzzleObjects: [
                {
                    id: "plate-2",
                    type: "plate",
                    position: { x: 3, y: 3 },
                    active: false,
                    triggers: ["bastion-door-2-2-E"]
                }
            ]
        },
        {
            roomId: "bastion-0-2",
            name: "Wine Cellar",
            coords: { x: 0, y: 2 },
            flavorText: "The floor is flooded with a mixture of water and vinegar from smashed wine casks. Skeletons patrol the murky depth.",
            enemySpawns: [{ type: "skeleton", count: 2 }],
            treasures: [{ type: "potion", count: 1 }],
            doors: [
                { x: 3, y: 0, leadsTo: "bastion-0-1" },
                { x: 6, y: 3, leadsTo: "bastion-1-2" },
                { x: 3, y: 6, leadsTo: "bastion-0-3" }
            ]
        },
        {
            roomId: "bastion-1-2",
            name: "Servant Quarters",
            coords: { x: 1, y: 2 },
            flavorText: "Modest rooms for the fortress staff. Now, only the sound of heavy breathing from the shadows remains.",
            enemySpawns: [{ type: "orc", count: 2 }],
            doors: [
                { x: 0, y: 3, leadsTo: "bastion-0-2" },
                { x: 3, y: 0, leadsTo: "bastion-1-1" },
                { x: 6, y: 3, leadsTo: "bastion-2-2" },
                { x: 3, y: 6, leadsTo: "bastion-1-3" }
            ]
        },
        {
            roomId: "bastion-2-2",
            name: "The Central Hub",
            coords: { x: 2, y: 2 },
            flavorText: "A wide circular chamber connecting all parts of the lower levels. A massive gate to the east remains tightly sealed.",
            enemySpawns: [],
            doors: [
                { x: 0, y: 3, leadsTo: "bastion-1-2" },
                { x: 3, y: 0, leadsTo: "bastion-2-1" },
                { id: "bastion-door-2-2-E", x: 6, y: 3, isLocked: true, leadsTo: "bastion-3-2" },
                { x: 3, y: 6, leadsTo: "bastion-2-3" }
            ]
        },
        {
            roomId: "bastion-3-2",
            name: "Alchemy Lab",
            coords: { x: 3, y: 2 },
            flavorText: "Bubbling vats and shattered beakers line the tables. A faint, glowing mist clings to the floor.",
            enemySpawns: [{ type: "ghost", count: 2 }],
            treasures: [
                { type: "hp_upgrade", count: 1 },
                { type: "energy_upgrade", count: 1 }
            ],
            doors: [
                { x: 0, y: 3, leadsTo: "bastion-2-2" },
                { x: 3, y: 0, leadsTo: "bastion-3-1" },
                { x: 6, y: 3, leadsTo: "bastion-4-2" },
                { x: 3, y: 6, leadsTo: "bastion-3-3" }
            ]
        },
        {
            roomId: "bastion-4-2",
            name: "Prayer Room",
            coords: { x: 4, y: 2 },
            flavorText: "A small chapel dedicated to a long-forgotten deity. The altar is stained with something dark and sticky.",
            enemySpawns: [{ type: "orc", count: 3 }],
            doors: [
                { x: 0, y: 3, leadsTo: "bastion-3-2" },
                { x: 3, y: 0, leadsTo: "bastion-4-1" },
                { x: 3, y: 6, leadsTo: "bastion-4-3" }
            ]
        },
        {
            roomId: "bastion-0-3",
            name: "Dungeon Cells",
            coords: { x: 0, y: 3 },
            flavorText: "Rows of damp, iron-barred cages. The rattling of chains can be heard even though the cages are empty.",
            enemySpawns: [{ type: "skeleton", count: 4 }],
            npcs: [
                {
                    id: "paladin-kaelen",
                    name: "Paladin Kaelen",
                    emoji: "🛡️",
                    position: { x: 1, y: 5 },
                    dialogue: [
                        "A hero? Here? My prayers have been answered!",
                        "I was captured weeks ago. The Dragon to the east... it's the Lich's most loyal servant.",
                        "It guards the Lich Seal. Without it, you'll never enter the Sanctum.",
                        "I'm too weak to fight, but take my vow. It will keep your heart true in the dragon's fire."
                    ]
                }
            ],
            treasures: [
                { type: "story-item", id: "kaelens-vow", name: "Kaelen's Vow", position: { x: 1, y: 1 } }
            ],
            doors: [
                { x: 3, y: 0, leadsTo: "bastion-0-2" },
                { x: 6, y: 3, leadsTo: "bastion-1-3" }
            ]
        },
        {
            roomId: "bastion-1-3",
            name: "Crypt",
            coords: { x: 1, y: 3 },
            flavorText: "The air here is ice-cold. Sarcophagi of the bastion's guardians line the walls, their lids pushed aside.",
            enemySpawns: [{ type: "skeleton", count: 3 }],
            doors: [
                { x: 0, y: 3, leadsTo: "bastion-0-3" },
                { x: 3, y: 0, leadsTo: "bastion-1-2" },
                { x: 6, y: 3, leadsTo: "bastion-2-3" }
            ]
        },
        {
            roomId: "bastion-2-3",
            name: "Treasure Vault",
            coords: { x: 2, y: 3 },
            flavorText: "Gold and gems are scattered everywhere, but they are covered in a thick layer of cobwebs.",
            enemySpawns: [{ type: "skeleton", count: 2 }],
            treasures: [{ type: "weapon", count: 1 }],
            doors: [
                { x: 0, y: 3, leadsTo: "bastion-1-3" },
                { x: 3, y: 0, leadsTo: "bastion-2-2" },
                { x: 6, y: 3, leadsTo: "bastion-3-3" }
            ]
        },
        {
            roomId: "bastion-3-3",
            name: "Pre-Boss Antechamber",
            coords: { x: 3, y: 3 },
            flavorText: "A grand hall leading to the heart of the lair. The walls are scorched, and the floor is littered with charred remains.",
            enemySpawns: [{ type: "skeleton", count: 4 }],
            doors: [
                { x: 0, y: 3, leadsTo: "bastion-2-3" },
                { x: 3, y: 0, leadsTo: "bastion-3-2" },
                { x: 6, y: 3, leadsTo: "bastion-4-3" }
            ]
        },
        {
            roomId: "bastion-4-3",
            name: "The Dragon's Lair",
            coords: { x: 4, y: 3 },
            flavorText: "A massive, soot-stained cavern. Deep within, the Lich Seal pulses with a rhythmic, golden light.",
            enemySpawns: [{ type: "dragon", count: 1 }],
            treasures: [{ type: "key-item", id: "lich-seal", name: "The Lich Seal", position: { x: 3, y: 3 } }],
            doors: [
                { x: 0, y: 3, leadsTo: "bastion-3-3" },
                { x: 3, y: 0, leadsTo: "bastion-4-2" }
            ]
        }
    ],
    winConditions: {
        defeatBoss: { enemyType: "dragon", required: true },
        collectItem: { itemId: "lich-seal", required: true },
        exfiltrate: { required: true }
    },
    victoryMessage: "The Lich Seal pulses in your hand as the fortress gates swing open. The path to the Sanctum is clear. The final battle awaits!"
};
