// src/data/treasures.js

export const treasureTypes = {
    "weapon": {
        name: "Weapon Upgrade",
        apply: (player) => {
            player.attack += 1;
            return { message: "You found a sharper sword! Attack +1.", heal: 0 };
        }
    },
    "potion": {
        name: "Health Potion",
        apply: (player) => {
            const healAmount = 5;
            const oldHp = player.hp;
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
            const actualHeal = player.hp - oldHp;
            return { message: `You found a health potion! HP restored by ${actualHeal}.`, heal: actualHeal };
        }
    },
    "hp_upgrade": {
        name: "Max HP Upgrade",
        apply: (player) => {
            player.maxHp += 3;
            player.hp += 3;
            return { message: "You feel reinvigorated! Max HP +3.", heal: 3 };
        }
    },
    "energy_upgrade": {
        name: "Energy Upgrade",
        apply: (player) => {
            // Permanently increase the total AP pool
            // Note: We'll need to make sure this is handled in turn reset too.
            // For now, let's update the player stat that gamestate.js reads from.
            player.stats.apTotal = (player.stats.apTotal || 6) + 1;
            return { message: "You feel a surge of energy! Max Actions +1.", heal: 0 };
        }
    },
    "gold": {
        name: "Gold Pile",
        apply: (player) => {
            const amount = Math.floor(Math.random() * 41) + 10; // 10 to 50 gold
            player.stats.gold = (player.stats.gold || 0) + amount;
            return { message: `You found ${amount} gold coins! Total: ${player.stats.gold}`, heal: 0 };
        }
    },
    "key-item": {
        name: "Key Item",
        apply: (player, treasure) => {
            player.inventory.push({ id: treasure.id, name: treasure.name });
            let msg = treasure.message || `You found the ${treasure.name}!`;
            let heal = 0;
            let powerUp = null;

            // Apply optional rewards
            if (treasure.reward) {
                if (treasure.reward.attack) {
                    player.attack += treasure.reward.attack;
                    msg += ` Attack +${treasure.reward.attack}!`;
                    powerUp = 'weapon';
                }
                if (treasure.reward.maxHp) {
                    player.maxHp += treasure.reward.maxHp;
                    player.hp += treasure.reward.maxHp;
                    msg += ` Max HP +${treasure.reward.maxHp}!`;
                    heal = treasure.reward.maxHp;
                    powerUp = 'hp_upgrade';
                }
                if (treasure.reward.apTotal) {
                    player.stats.apTotal = (player.stats.apTotal || 6) + treasure.reward.apTotal;
                    msg += ` Max Actions +${treasure.reward.apTotal}!`;
                    powerUp = 'energy_upgrade';
                }
            }

            return { message: msg, heal, powerUp };
        }
    },
    "story-item": {
        name: "Story Item",
        apply: (player, treasure) => {
            player.inventory.push({ id: treasure.id, name: treasure.name });
            let msg = treasure.message || `You found the ${treasure.name}.`;
            let heal = 0;
            let powerUp = null;

            // Apply optional rewards
            if (treasure.reward) {
                if (treasure.reward.attack) {
                    player.attack += treasure.reward.attack;
                    msg += ` Attack +${treasure.reward.attack}!`;
                    powerUp = 'weapon';
                }
                if (treasure.reward.maxHp) {
                    player.maxHp += treasure.reward.maxHp;
                    player.hp += treasure.reward.maxHp;
                    msg += ` Max HP +${treasure.reward.maxHp}!`;
                    heal = treasure.reward.maxHp;
                    powerUp = 'hp_upgrade';
                }
                if (treasure.reward.apTotal) {
                    player.stats.apTotal = (player.stats.apTotal || 6) + treasure.reward.apTotal;
                    msg += ` Max Actions +${treasure.reward.apTotal}!`;
                    powerUp = 'energy_upgrade';
                }
            }

            return { message: msg, heal, powerUp };
        }
    }
};

export function applyTrap(player) {
    const damage = Math.floor(Math.random() * 2) + 1; // 1 to 2 damage
    player.hp -= damage;
    return { message: `It was a trap! You take ${damage} damage.`, damage: damage };
}
