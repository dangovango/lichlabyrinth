// src/renderer/renderer.js
import { PLAYER_CONFIG } from '../data/player.js';
import { createFloorPattern, createWallPattern } from '../utils/textures.js';

/**
 * Helper to check if everything EXCEPT exfiltration is finished.
 * Used for visual feedback (e.g., making the exit glow).
 */
function checkAllObjectivesExceptExfil(gameState) {
    if (!gameState || !gameState.quest || !gameState.quest.winConditions) return false;
    const { winConditions } = gameState.quest;
    const progress = gameState.quest.progress || {};
    const { player } = gameState;
    
    let mandatoryGoalsMet = true;

    if (winConditions.defeatBoss?.required && !progress.defeatBoss) mandatoryGoalsMet = false;
    if (winConditions.reachRoom?.required && !progress.reachRoom) mandatoryGoalsMet = false;
    if (winConditions.collectItem?.required) {
        const hasItem = player.inventory.some(item => item.id === winConditions.collectItem.itemId);
        if (!hasItem) mandatoryGoalsMet = false;
    }
    if (winConditions.monsterQuota?.required) {
        const killCount = progress.killCount || 0;
        if (killCount < winConditions.monsterQuota.count) mandatoryGoalsMet = false;
    }
    if (winConditions.puzzleSolved?.required) {
        const requiredIds = winConditions.puzzleSolved.requires;
        const allActive = requiredIds.every(reqId => {
            for (const r of gameState.quest.rooms) {
                if (r.puzzleObjects) {
                    const po = r.puzzleObjects.find(p => p.id === reqId);
                    if (po) return po.active;
                }
            }
            return false;
        });
        if (!allActive) mandatoryGoalsMet = false;
    }

    return mandatoryGoalsMet;
}

export class Renderer {
    constructor(context, cellSize) {
        this.ctx = context;
        this.cellSize = cellSize;
        this.camera = { x: 0, y: 0 };
        this.cameraSpeed = 0.1;
        
        // --- Animation State ---
        this.visualEntities = {};
        this.shakeIntensity = 0;
        this.shakeMultiplier = 0.5;
        this.lastFrameTime = Date.now();

        // --- Textures ---
        this.floorPattern = createFloorPattern(this.ctx, this.cellSize);
        this.wallPattern = createWallPattern(this.ctx, this.cellSize);

        // --- Particles ---
        this.particles = [];
    }

    draw(gameState) {
        if (!gameState || !gameState.currentRoom) return;

        const now = Date.now();
        const deltaTime = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        const settings = gameState.settings || { showHealthBars: true, showEmbers: true, showBossPresence: true, screenShake: true };

        this.updateVisualState(gameState, deltaTime);
        this.updateCamera(gameState.player);
        this.updateParticles(deltaTime);

        // Spawn embers near player
        if (settings.showEmbers) {
            const vP = this.visualEntities[gameState.player.id] || gameState.player.position;
            this.spawnTorchEmbers(vP, deltaTime);
        }

        // Update patterns to move with the camera so they stay 'glued' to the world coordinates
        if (this.floorPattern && this.wallPattern) {
            const matrix = new DOMMatrix().translate(-this.camera.x, -this.camera.y);
            this.floorPattern.setTransform(matrix);
            this.wallPattern.setTransform(matrix);
        }

        this.clear();

        let shakeX = 0;
        let shakeY = 0;
        if (this.shakeIntensity > 0 && settings.screenShake) {
            shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= 0.9;
            if (this.shakeIntensity < 0.1) this.shakeIntensity = 0;
        }

        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);

        this.drawRoom(gameState.currentRoom, gameState);
        this.drawTreasures(gameState.currentRoom.treasures);
        this.drawNPCs(gameState.currentRoom.npcs);
        this.drawEnemies(gameState.currentRoom.enemies, settings);
        this.drawPlayer(gameState.player, gameState); // Pass gameState to drawPlayer
        
        if (settings.showHealthBars) {
            this.drawPlayerHealthBar(gameState.player);
        }

        this.drawParticles();
        this.drawVisualEffects(gameState.visualEffects, gameState.player, gameState.currentRoom.enemies);
        
        this.ctx.restore();

        // Draw vignette effect over everything else
        this.drawVignette(gameState);
        
        if (settings.showBossPresence) {
            this.drawBossPresence(gameState);
        }
    }

    drawBossPresence(gameState) {
        const hasBoss = gameState.currentRoom.enemies.some(e => e.isBoss);
        if (!hasBoss) return;

        const pulse = this.getPulseScale(0.002, 0.15);
        const intensity = 0.2 * pulse;

        // Apply a poisonous green/spectral glow to the edges when a boss is present
        const grad = this.ctx.createRadialGradient(
            this.ctx.canvas.width / 2, this.ctx.canvas.height / 2, 0,
            this.ctx.canvas.width / 2, this.ctx.canvas.height / 2, this.ctx.canvas.width
        );
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, `rgba(0, 255, 0, ${intensity})`);

        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    spawnTorchEmbers(vP, deltaTime) {
        // Only spawn a few per frame
        if (Math.random() > 0.3) return;

        const centerX = vP.x * this.cellSize + this.cellSize / 2;
        const centerY = vP.y * this.cellSize + this.cellSize / 2;

        this.particles.push({
            x: centerX + (Math.random() * 10 - 5),
            y: centerY + (Math.random() * 10 - 5),
            vx: (Math.random() - 0.5) * 20,
            vy: -30 - Math.random() * 30, // Rise up
            life: 0.5 + Math.random() * 0.5,
            size: 1 + Math.random() * 2,
            color: Math.random() > 0.5 ? '#ff8c00' : '#ffd700'
        });
    }

    drawParticles() {
        this.ctx.save();
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x - this.camera.x, p.y - this.camera.y, p.size, p.size);
        });
        this.ctx.restore();
    }

    updateVisualState(gameState, deltaTime) {
        const smoothing = 15;
        const p = gameState.player;
        if (!this.visualEntities[p.id]) {
            this.visualEntities[p.id] = { x: p.position.x, y: p.position.y };
        }
        const vP = this.visualEntities[p.id];
        vP.x += (p.position.x - vP.x) * smoothing * deltaTime;
        vP.y += (p.position.y - vP.y) * smoothing * deltaTime;

        gameState.currentRoom.enemies.forEach(enemy => {
            if (!this.visualEntities[enemy.id]) {
                this.visualEntities[enemy.id] = { x: enemy.position.x, y: enemy.position.y };
            }
            const vE = this.visualEntities[enemy.id];
            vE.x += (enemy.position.x - vE.x) * smoothing * deltaTime;
            vE.y += (enemy.position.y - vE.y) * smoothing * deltaTime;
        });

        // NPCs are currently static, but we'll register them for consistency
        if (gameState.currentRoom.npcs) {
            gameState.currentRoom.npcs.forEach(npc => {
                if (!this.visualEntities[npc.id]) {
                    this.visualEntities[npc.id] = { x: npc.position.x, y: npc.position.y };
                }
            });
        }

        const activeEntityIds = new Set([
            p.id, 
            ...gameState.currentRoom.enemies.map(e => e.id),
            ...(gameState.currentRoom.npcs ? gameState.currentRoom.npcs.map(n => n.id) : [])
        ]);

        Object.keys(this.visualEntities).forEach(id => {
            if (!activeEntityIds.has(id)) {
                delete this.visualEntities[id];
            }
        });
    }

    updateCamera(player) {
        const vP = this.visualEntities[player.id] || player.position;
        const targetX = vP.x * this.cellSize - (this.ctx.canvas.width / 2) + (this.cellSize / 2);
        const targetY = vP.y * this.cellSize - (this.ctx.canvas.height / 2) + (this.cellSize / 2);
        this.camera.x += (targetX - this.camera.x) * this.cameraSpeed;
        this.camera.y += (targetY - this.camera.y) * this.cameraSpeed;
    }

    triggerShake(intensity = 10) {
        this.shakeIntensity = intensity * this.shakeMultiplier;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    getPulseScale(speed = 0.005, range = 0.1) {
        return 1 + Math.sin(Date.now() * speed) * range;
    }

    drawRoom(room, gameState) {
        const margin = 2;
        const size = this.cellSize - margin * 2;
        const radius = 5;
        const switchPulse = this.getPulseScale(0.003, 0.05);

        // Draw floor
        this.ctx.fillStyle = this.floorPattern;
        for (let y = 0; y < 7; y++) {
            for (let x = 0; x < 7; x++) {
                const screenX = x * this.cellSize - this.camera.x + margin;
                const screenY = y * this.cellSize - this.camera.y + margin;
                
                // Outer tile border for extra contrast against black background
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                this.roundRect(screenX - 1, screenY - 1, size + 2, size + 2, radius + 1);
                
                this.ctx.fillStyle = this.floorPattern;
                this.roundRect(screenX, screenY, size, size, radius);
            }
        }

        // Draw walls
        this.ctx.fillStyle = this.wallPattern;
        room.layout.walls.forEach(wall => {
            const screenX = wall.x * this.cellSize - this.camera.x + margin;
            const screenY = wall.y * this.cellSize - this.camera.y + margin;
            
            // Wall border/glow to make it pop from the floor
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.roundRect(screenX - 1, screenY - 1, size + 2, size + 2, radius + 1);
            
            this.ctx.fillStyle = this.wallPattern;
            this.roundRect(screenX, screenY, size, size, radius);
            
            // Beveled highlight for depth
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });

        // Draw puzzle objects
        if (room.puzzleObjects) {
            room.puzzleObjects.forEach(obj => {
                const screenX = obj.position.x * this.cellSize - this.camera.x + margin;
                const screenY = obj.position.y * this.cellSize - this.camera.y + margin;

                if (obj.type === 'plate') {
                    this.ctx.fillStyle = obj.active ? '#4CAF50' : '#333';
                    this.roundRect(screenX + 4, screenY + 4, size - 8, size - 8, radius);
                    this.ctx.fillStyle = obj.active ? '#fff' : '#666';
                    this.ctx.beginPath();
                    this.ctx.arc(screenX + size/2 + margin, screenY + size/2 + margin, size/4, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (obj.type === 'switch') {
                    const currentSize = obj.active ? size * switchPulse : size;
                    const offset = (size - currentSize) / 2;
                    this.ctx.fillStyle = obj.active ? '#2196F3' : '#333';
                    this.roundRect(screenX + 4 + offset, screenY + 4 + offset, currentSize - 8, currentSize - 8, radius);
                    this.ctx.font = `${this.cellSize * 0.3 * (obj.active ? switchPulse : 1)}px sans-serif`;
                    this.ctx.fillStyle = obj.active ? '#fff' : '#666';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(obj.active ? '⚡' : '⚙️', screenX + size/2, screenY + size/2);
                }
            });
        }

        // Draw doors and Exits
        const roomDoors = room.doors || room.layout.doors || [];
        roomDoors.forEach(door => {
            const dx = door.position ? door.position.x : door.x;
            const dy = door.position ? door.position.y : door.y;
            const screenX = dx * this.cellSize - this.camera.x + margin;
            const screenY = dy * this.cellSize - this.camera.y + margin;
            const centerX = screenX + size / 2;
            const centerY = screenY + size / 2;
            
            if (door.isLocked) {
                // Ornate Locked Door
                this.ctx.fillStyle = '#5d4037'; // Bronze base
                this.roundRect(screenX, screenY, size, size, radius);
                this.ctx.fillStyle = '#2b1b17'; // Darker inset
                this.roundRect(screenX + 4, screenY + 4, size - 8, size - 8, 2);
                
                // Lock Icon
                this.ctx.font = `${this.cellSize * 0.4}px sans-serif`;
                this.ctx.fillStyle = '#ffd700';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('🔒', centerX, centerY);
            } else if (door.isExit || (!door.leadsTo && gameState?.quest?.winConditions?.exfiltrate?.required)) {
                // This is an EXFILTRATION / EXIT door
                const isReadyToExit = checkAllObjectivesExceptExfil(gameState);
                const pulse = isReadyToExit ? this.getPulseScale(0.01, 0.2) : 1.0;
                
                this.ctx.save();
                this.ctx.translate(centerX, centerY);
                this.ctx.scale(pulse, pulse);
                this.drawEmojiAtOrigin('🏁'); 
                this.ctx.restore();
                
                this.ctx.font = `bold ${this.cellSize * 0.2}px Arial`;
                this.ctx.fillStyle = isReadyToExit ? '#4CAF50' : '#888';
                this.ctx.textAlign = 'center';
                this.ctx.fillText("EXIT", centerX, centerY + this.cellSize * 0.4);
            } else {
                // Standard Transition Door (Ornate Wood & Bronze)
                // 1. Bronze Frame
                this.ctx.fillStyle = '#8b4513'; 
                this.roundRect(screenX, screenY, size, size, radius);
                
                // 2. Dark Wood Panel
                this.ctx.fillStyle = '#3e2723'; 
                this.roundRect(screenX + 3, screenY + 3, size - 6, size - 6, 2);
                
                // 3. Iron Bands / Planks
                this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                // Vertical planks
                this.ctx.moveTo(screenX + size/3, screenY + 3);
                this.ctx.lineTo(screenX + size/3, screenY + size - 3);
                this.ctx.moveTo(screenX + (size/3)*2, screenY + 3);
                this.ctx.lineTo(screenX + (size/3)*2, screenY + size - 3);
                this.ctx.stroke();

                // 4. Golden Ring Handle
                this.ctx.strokeStyle = '#ffd700';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.arc(centerX + size/4, centerY, 4, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });
    }

    drawPlayer(player, gameState) {
        const vP = this.visualEntities[player.id] || player.position;
        const pulse = this.getPulseScale(0.004, 0.03);
        const centerX = vP.x * this.cellSize + this.cellSize / 2 - this.camera.x;
        const centerY = vP.y * this.cellSize + this.cellSize / 2 - this.camera.y;

        // Draw the player emoji first
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(pulse, pulse);
        this.drawEmojiAtOrigin(PLAYER_CONFIG.emoji);
        this.ctx.restore();

        // Then, draw the glow on top
        if (gameState.quest && gameState.quest.turnLimit) {
            const remainingTurns = Math.max(0, gameState.quest.turnLimit - gameState.quest.turnsElapsed);
            const torchPercent = remainingTurns / gameState.quest.turnLimit;

            // Add slight flicker to the glow
            const flicker = (Math.random() * 0.05) - 0.025;
            const baseGlowRadius = this.cellSize * 2.5;
            const glowRadius = baseGlowRadius * (0.5 + torchPercent * 0.5 + flicker);

            const glow = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, glowRadius
            );
            
            const r = Math.floor(255 * (0.5 + torchPercent * 0.5));
            const g = Math.floor(165 * torchPercent);
            const b = 0;
            const startAlpha = (0.5 * torchPercent) + flicker; // Reduced from 0.6

            glow.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, ${Math.max(0, startAlpha)})`);
            glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

            this.ctx.globalCompositeOperation = 'lighter';
            this.ctx.fillStyle = glow;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalCompositeOperation = 'source-over';
        }
    }

    drawPlayerHealthBar(player) {
        const vP = this.visualEntities[player.id] || player.position;
        const screenX = vP.x * this.cellSize - this.camera.x;
        const screenY = vP.y * this.cellSize - this.camera.y;

        const barWidth = this.cellSize * 0.8;
        const barHeight = 6;
        const barX = screenX + (this.cellSize - barWidth) / 2;
        const barY = screenY - 10;

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.roundRect(barX, barY, barWidth, barHeight, 2);

        // Fill
        const hpPercent = Math.max(0, player.hp / player.maxHp);
        this.ctx.fillStyle = hpPercent > 0.4 ? '#4CAF50' : '#f44336';
        const fillWidth = Math.max(0, (barWidth - 2) * hpPercent);
        this.roundRect(barX + 1, barY + 1, fillWidth, barHeight - 2, 1);
    }

    drawEnemies(enemies, settings) {
        const enemyEmojis = { goblin: '👹', ghost: '👻', orc: '🐷', dragon: '🐉', skeleton: '💀', lich: '🧙‍♂️' };
        enemies.forEach(enemy => {
            const vE = this.visualEntities[enemy.id] || enemy.position;
            const type = enemy.id.split('-')[0];
            const screenX = vE.x * this.cellSize - this.camera.x;
            const screenY = vE.y * this.cellSize - this.camera.y;

            this.drawEmoji(enemy.emoji || enemyEmojis[type] || '❓', vE);

            if (settings.showHealthBars) {
                const barWidth = this.cellSize * 0.6;
                const barHeight = 4;
                const barX = screenX + (this.cellSize - barWidth) / 2;
                const barY = screenY + 5;
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                this.ctx.fillRect(barX, barY, barWidth, barHeight);
                const hpPercent = Math.max(0, enemy.hp / (enemy.maxHp || enemy.hp || 1));
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
            }
        });
    }

    drawNPCs(npcs) {
        if (!npcs) return;
        const pulse = this.getPulseScale(0.003, 0.04);
        npcs.forEach(npc => {
            const vN = this.visualEntities[npc.id] || npc.position;
            const screenX = vN.x * this.cellSize - this.camera.x;
            const screenY = vN.y * this.cellSize - this.camera.y;
            const centerX = screenX + this.cellSize / 2;
            const centerY = screenY + this.cellSize / 2;

            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.scale(pulse, pulse);
            this.drawEmojiAtOrigin(npc.emoji || '🧙');
            this.ctx.restore();

            // Draw name tag
            this.ctx.font = `bold ${this.cellSize * 0.18}px Arial`;
            this.ctx.fillStyle = 'white';
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 2;
            this.ctx.textAlign = 'center';
            this.ctx.strokeText(npc.name, centerX, screenY + this.cellSize * 0.9);
            this.ctx.fillText(npc.name, centerX, screenY + this.cellSize * 0.9);
        });
    }

    drawTreasures(treasures) {
        const pulse = this.getPulseScale(0.008, 0.15);
        treasures.forEach(treasure => {
            const centerX = treasure.position.x * this.cellSize + this.cellSize / 2 - this.camera.x;
            const centerY = treasure.position.y * this.cellSize + this.cellSize / 2 - this.camera.y;
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.scale(pulse, pulse);
            
            const emoji = treasure.type === 'story-item' || treasure.type === 'key-item' ? '📜' : '✨';
            this.drawEmojiAtOrigin(emoji);
            this.ctx.restore();
        });
    }

    drawVignette(gameState) {
        const { quest, player } = gameState;
        if (!quest || !quest.turnLimit) return; // Only apply effect if there is a turn limit

        const vP = this.visualEntities[player.id] || player.position;
        const playerScreenX = vP.x * this.cellSize + this.cellSize / 2 - this.camera.x;
        const playerScreenY = vP.y * this.cellSize + this.cellSize / 2 - this.camera.y;

        const remainingTurns = Math.max(0, quest.turnLimit - quest.turnsElapsed);
        const torchPercent = remainingTurns / quest.turnLimit;

        // Add flicker to the vignette radius
        const flicker = (Math.random() * 0.02) - 0.01;
        const lightRadius = this.ctx.canvas.width * (0.4 + torchPercent * 0.8 + flicker);
        const minRadius = this.cellSize * 1.5;
        const finalRadius = Math.max(minRadius, lightRadius);

        // Create a gradient that fades from transparent to solid black
        const gradient = this.ctx.createRadialGradient(
            playerScreenX, playerScreenY, finalRadius * 0.5, // Inner circle (brighter)
            playerScreenX, playerScreenY, finalRadius       // Outer circle (fades to black)
        );

        // The 'darkness' is stronger when the torch is low.
        const darknessAlpha = 1.0 - torchPercent;
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.8, `rgba(0, 0, 0, ${Math.max(0, darknessAlpha * 0.5 + flicker)})`); // Reduced from 0.6
        gradient.addColorStop(1, `rgba(0, 0, 0, ${Math.max(0, darknessAlpha * 0.8 + flicker)})`);   // Reduced from 0.9

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    drawEmojiAtOrigin(emoji) {
        this.ctx.font = `${this.cellSize * 0.6}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(emoji, 0, 0);
    }

    drawEmoji(emoji, position) {
        this.ctx.font = `${this.cellSize * 0.6}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(emoji, position.x * this.cellSize + this.cellSize / 2 - this.camera.x, position.y * this.cellSize + this.cellSize / 2 - this.camera.y);
    }

    drawVisualEffects(visualEffects, player, enemies) {
        if (!visualEffects) return;
        const now = Date.now();
        const duration = 1200;

        visualEffects.forEach(effect => {
            const elapsed = now - (effect.startTime || now);
            if (elapsed > duration) return;

            const progress = elapsed / duration;
            const fade = 1 - progress;
            const rise = progress * 50;

            let targetPosition = null;
            if (effect.targetId === player.id) {
                targetPosition = this.visualEntities[player.id] || player.position;
                if (effect.type === 'damageNumber') {
                    const isHeal = String(effect.amount).startsWith('+');
                    this.ctx.fillStyle = isHeal ? `rgba(0, 255, 0, ${fade * 0.2})` : `rgba(255, 0, 0, ${fade * 0.3})`;
                    if (!isHeal) this.triggerShake(12);
                    this.ctx.fillRect(-100, -100, this.ctx.canvas.width + 200, this.ctx.canvas.height + 200);
                } else if (effect.type === 'flash') {
                    this.triggerShake(16);
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${fade * 0.5})`;
                    this.ctx.fillRect(-100, -100, this.ctx.canvas.width + 200, this.ctx.canvas.height + 200);
                } else if (effect.type === 'powerUp') {
                    let flashColor = '255, 215, 0'; // Default Gold
                    if (effect.amount === 'energy_upgrade') flashColor = '0, 229, 255';
                    if (effect.amount === 'hp_upgrade') flashColor = '76, 175, 80';
                    
                    this.ctx.fillStyle = `rgba(${flashColor}, ${fade * 0.4})`;
                    this.ctx.fillRect(-100, -100, this.ctx.canvas.width + 200, this.ctx.canvas.height + 200);
                    this.triggerShake(8);
                }
            } else {
                const enemy = enemies.find(e => e.id === effect.targetId);
                if (enemy) {
                    targetPosition = this.visualEntities[enemy.id] || enemy.position;
                    if (effect.type === 'damageNumber') this.triggerShake(6);
                }
            }

            if (targetPosition) {
                const screenX = targetPosition.x * this.cellSize - this.camera.x;
                const screenY = targetPosition.y * this.cellSize - this.camera.y;
                const centerX = screenX + this.cellSize / 2;
                const centerY = screenY + this.cellSize / 2;

                if (effect.type === 'damageNumber' && effect.amount !== null) {
                    const isHeal = String(effect.amount).startsWith('+');
                    this.ctx.font = `bold ${this.cellSize * (isHeal ? 0.6 : 0.5)}px Arial`;
                    this.ctx.globalAlpha = fade;
                    this.ctx.fillStyle = isHeal ? '#00ff00' : 'white';
                    this.ctx.strokeStyle = isHeal ? 'white' : 'red';
                    this.ctx.lineWidth = 3;
                    this.ctx.textAlign = 'center';
                    const displayText = String(effect.amount);
                    this.ctx.strokeText(displayText, centerX, screenY - 5 - rise);
                    this.ctx.fillText(displayText, centerX, screenY - 5 - rise);
                    this.ctx.globalAlpha = 1.0;
                } else if (effect.type === 'powerUp') {
                    // --- THE GRAND FANFARE ---
                    let color = '#FFD700'; // Default Gold
                    let label = 'ATTACK UP!';
                    
                    if (effect.amount === 'energy_upgrade') {
                        color = '#00E5FF';
                        label = 'ENERGY UP!';
                    } else if (effect.amount === 'hp_upgrade') {
                        color = '#4CAF50';
                        label = 'MAX HP UP!';
                    }
                    
                    // 1. Draw Rotating Rays
                    this.ctx.save();
                    this.ctx.translate(centerX, centerY);
                    this.ctx.globalAlpha = fade * 0.6;
                    this.ctx.strokeStyle = color;
                    this.ctx.lineWidth = 4;
                    const rays = 8;
                    const rotation = now * 0.005;
                    this.ctx.rotate(rotation);
                    for (let i = 0; i < rays; i++) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, 0);
                        this.ctx.lineTo(0, this.cellSize * 1.5 * progress);
                        this.ctx.stroke();
                        this.ctx.rotate((Math.PI * 2) / rays);
                    }
                    this.ctx.restore();

                    // 2. Draw Scaling Text (Horizontal)
                    this.ctx.save();
                    this.ctx.translate(centerX, centerY);
                    this.ctx.globalAlpha = fade;
                    const scale = 1 + Math.sin(progress * Math.PI) * 0.5;
                    this.ctx.scale(scale, scale);
                    this.ctx.font = `bold ${this.cellSize * 0.4}px sans-serif`;
                    this.ctx.fillStyle = color;
                    this.ctx.strokeStyle = 'black';
                    this.ctx.lineWidth = 4;
                    this.ctx.textAlign = 'center';
                    this.ctx.strokeText(label, 0, -this.cellSize * 0.8);
                    this.ctx.fillText(label, 0, -this.cellSize * 0.8);
                    this.ctx.restore();
                } else if (effect.type === 'flash') {
                    this.ctx.fillStyle = `rgba(255, 0, 0, ${fade * 0.5})`;
                    this.roundRect(screenX + 2, screenY + 2, this.cellSize - 4, this.cellSize - 4, 5);
                }
            }
        });
    }
}
