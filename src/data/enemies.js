// src/data/enemies.js

const enemyTypes = {
    "goblin": {
        name: "Goblin",
        hp: 3,
        attack: 1,
        movementRange: 2,
        emoji: '👹'
    },
    "ghost": {
        name: "Ghost",
        hp: 2,
        attack: 2,
        movementRange: 3,
        emoji: '👻'
    },
    "orc": {
        name: "Orc",
        hp: 5,
        attack: 2,
        movementRange: 1,
        emoji: '🐷'
    },
    "skeleton": {
        name: "Skeleton",
        hp: 4,
        attack: 2,
        movementRange: 2,
        emoji: '💀'
    },
    "lich": {
        name: "Lich",
        hp: 6,
        attack: 3,
        movementRange: 2,
        emoji: '🧙‍♂️',
        isBoss: true
    },
    "dragon": {
        name: "Fire Dragon",
        hp: 10,
        attack: 4,
        movementRange: 2,
        emoji: '🐉',
        isBoss: true
    }
};

export default enemyTypes;
