// src/renderer/ui.js
import { canMove, canFight, canSearch, canExit, isPathBlocked } from '../game/actionValidator.js';

export class UI {
    constructor(actions) {
        this.actions = actions;
        this.hpElement = document.getElementById('player-hp');
        this.maxHpElement = document.getElementById('player-max-hp');
        this.apElement = document.getElementById('player-ap');
        this.apTotalElement = document.getElementById('player-ap-total');
        this.attackElement = document.getElementById('player-attack');
        this.goldElement = document.getElementById('player-gold');
        this.messageElement = document.getElementById('log-message');
        
        this.torchPanel = document.getElementById('torch-gauge-hud');
        this.torchFill = document.getElementById('torch-gauge-fill');
        this.objectivesContent = document.getElementById('objectives-content');
        
        this.moveButtons = {
            up: document.getElementById('move-up'),
            down: document.getElementById('move-down'),
            left: document.getElementById('move-left'),
            right: document.getElementById('move-right'),
        };

        this.bindEvents();
    }

    update(gameState) {
        if (!gameState || !gameState.currentRoom) return;
        this.updatePlayerStats(gameState.player);
        this.log(gameState.message);
        this.updateActionButtons(gameState);
        this.updateTorchGauge(gameState.quest);
        this.updateObjectives(gameState);
    }

    updateObjectives(gameState) {
        if (!this.objectivesContent || !gameState.quest) return;
        
        const { quest, player } = gameState;
        const winConditions = quest.winConditions || {};
        const progress = quest.progress || {};
        const rooms = quest.rooms || [];
        
        let html = '';

        // 1. Defeat Boss
        if (winConditions.defeatBoss && winConditions.defeatBoss.required) {
            const isDone = progress.defeatBoss;
            html += this.createObjectiveHtml(`Slay the ${winConditions.defeatBoss.enemyType}`, isDone);
        }

        // 2. Reach Room
        if (winConditions.reachRoom && winConditions.reachRoom.required) {
            const targetRoom = rooms.find(r => r.roomId === winConditions.reachRoom.roomId);
            const isDone = progress.reachRoom;
            html += this.createObjectiveHtml(`Explore the ${targetRoom ? targetRoom.name : 'Unknown Room'}`, isDone);
        }

        // 3. Collect Item
        if (winConditions.collectItem && winConditions.collectItem.required) {
            const isDone = player.inventory.some(item => item.id === winConditions.collectItem.itemId);
            html += this.createObjectiveHtml(`Retrieve the ${winConditions.collectItem.itemId.replace(/-/g, ' ')}`, isDone);
        }

        // 4. Monster Quota
        if (winConditions.monsterQuota && winConditions.monsterQuota.required) {
            const killCount = progress.killCount || 0;
            const quota = winConditions.monsterQuota.count;
            const isDone = killCount >= quota;
            html += this.createObjectiveHtml(`Slay Monsters (${killCount}/${quota})`, isDone);
        }

        // 5. Puzzle Solved
        if (winConditions.puzzleSolved && winConditions.puzzleSolved.required) {
            const requiredIds = winConditions.puzzleSolved.requires;
            const allActive = requiredIds.every(reqId => {
                for (const r of rooms) {
                    if (r.puzzleObjects) {
                        const po = r.puzzleObjects.find(p => p.id === reqId);
                        if (po) return po.active;
                    }
                }
                return false;
            });
            html += this.createObjectiveHtml("Activate the ancient mechanisms", allActive);
        }

        // 6. Exfiltrate
        if (winConditions.exfiltrate && winConditions.exfiltrate.required) {
            // Check if others are done
            let mandatoryGoalsMet = true;
            if (winConditions.defeatBoss?.required && !progress.defeatBoss) mandatoryGoalsMet = false;
            if (winConditions.reachRoom?.required && !progress.reachRoom) mandatoryGoalsMet = false;
            if (winConditions.collectItem?.required && !player.inventory.some(item => item.id === winConditions.collectItem.itemId)) mandatoryGoalsMet = false;
            if (winConditions.monsterQuota?.required && (progress.killCount || 0) < winConditions.monsterQuota.count) mandatoryGoalsMet = false;

            html += this.createObjectiveHtml("Escape the dungeon!", false, mandatoryGoalsMet ? "Ready to exit" : "Entrance locked");
        }

        this.objectivesContent.innerHTML = html;
    }

    createObjectiveHtml(text, isCompleted, subtext = '') {
        return `
            <div class="objective-item ${isCompleted ? 'completed' : ''}">
                <div class="objective-bullet"></div>
                <div class="flex flex-col">
                    <span>${text}</span>
                    ${subtext ? `<span style="font-size: 0.7rem; opacity: 0.6; font-style: italic;">${subtext}</span>` : ''}
                </div>
            </div>
        `;
    }

    updateTorchGauge(quest) {
        if (!quest || !this.torchPanel || !this.torchFill) return;

        if (quest.turnLimit && quest.turnLimit > 0) {
            this.torchPanel.style.display = 'flex';
            const remainingTurns = Math.max(0, quest.turnLimit - quest.turnsElapsed);
            const percentage = (remainingTurns / quest.turnLimit) * 100;
            this.torchFill.style.width = `${percentage}%`;
        } else {
            this.torchPanel.style.display = 'none';
        }
    }

    updatePlayerStats(player) {
        if (!player) return; // Safeguard against state corruption
        this.hpElement.textContent = player.hp;
        this.maxHpElement.textContent = player.maxHp;
        this.attackElement.textContent = player.attack;
        if (this.goldElement) this.goldElement.textContent = player.stats.gold || 0;
    }

    log(message) {
        this.messageElement.textContent = message || "";
    }

    bindEvents() {
        if (this.moveButtons.up) this.moveButtons.up.onclick = () => this.actions.move(0, -1);
        if (this.moveButtons.down) this.moveButtons.down.onclick = () => this.actions.move(0, 1);
        if (this.moveButtons.left) this.moveButtons.left.onclick = () => this.actions.move(-1, 0);
        if (this.moveButtons.right) this.moveButtons.right.onclick = () => this.actions.move(1, 0);
    }

    updateActionButtons(gameState) {
        const isPlayerTurn = gameState.gameStatus === 'playing';
        this.apElement.textContent = gameState.turn.ap;
        this.apTotalElement.textContent = gameState.turn.apTotal;

        // Update move buttons
        const canPlayerMove = canMove(gameState);
        this.moveButtons.up.disabled = !isPlayerTurn || !canPlayerMove || !!isPathBlocked(gameState, 0, -1);
        this.moveButtons.down.disabled = !isPlayerTurn || !canPlayerMove || !!isPathBlocked(gameState, 0, 1);
        this.moveButtons.left.disabled = !isPlayerTurn || !canPlayerMove || !!isPathBlocked(gameState, -1, 0);
        this.moveButtons.right.disabled = !isPlayerTurn || !canPlayerMove || !!isPathBlocked(gameState, 1, 0);
    }
}
