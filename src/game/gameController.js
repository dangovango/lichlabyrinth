import { getInitialState } from './gameState.js';
import { Renderer } from '../renderer/renderer.js';
import { UI } from '../renderer/ui.js';
import { initializeFirstRoom } from './questManager.js';
import { isPathBlocked, canFight, canSearch, canInteract, canExit, getAdjacentEnemies, getAdjacentNPCs } from './actionValidator.js';
import { executeMove, executeFight, executeSearch, executeExit, executeInteract } from './actionExecutor.js';
import { endPlayerTurn } from './turnResolver.js';
import { soundManager } from '../utils/audio.js';

// --- Game State ---
export let gameState;
let renderer;
let ui;
let gameLoopRunning = false;

export function startGame(quest) {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Canvas element not found. Game cannot start.");
        return;
    }
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    const questNameElem = document.getElementById('quest-name');
    if (questNameElem) questNameElem.textContent = quest.name;

    gameState = getInitialState(quest);
    gameState = initializeFirstRoom(gameState);

    renderer = new Renderer(ctx, 400 / 7);
    
    // Initialize UI with action handlers
    ui = new UI({
        move: handleMove,
        fight: handleFight,
        search: handleSearch,
        exit: handleExit
    });

    // Setup the contextual action button once
    const actionButton = document.getElementById('action-button');
    if (actionButton) {
        actionButton.onclick = handleContextualAction;
    }

    // Expose actions for UI to use
    window.gameActions = {
        restart: () => startGame(quest),
        goHome: handleGoHome
    };

    if (!gameLoopRunning) {
        gameLoopRunning = true;
        gameLoop();
    }
}

function gameLoop() {
    function loop() {
        if (!gameState) {
            gameLoopRunning = false;
            return;
        }
        ui.update(gameState);
        
        const roomNameElem = document.getElementById('room-name');
        if (roomNameElem && gameState.currentRoom) {
            roomNameElem.textContent = gameState.currentRoom.name;
        }

        const actionButton = document.getElementById('action-button');
        if (actionButton && gameState.currentRoom) {
            actionButton.onclick = handleContextualAction;

            const adjacentEnemies = getAdjacentEnemies(gameState);
            const adjacentNPCs = getAdjacentNPCs(gameState);
            const hasTreasureAtPos = gameState.currentRoom.treasures.some(t => t.position.x === gameState.player.position.x && t.position.y === gameState.player.position.y);
            const atExit = canExit(gameState);

            const doors = gameState.currentRoom.doors || (gameState.currentRoom.layout && gameState.currentRoom.layout.doors) || [];
            // Check if player is STANDING ON a door
            const doorAtPlayer = doors.find(d => {
                const dx = d.position ? d.position.x : d.x;
                const dy = d.position ? d.position.y : d.y;
                return dx === gameState.player.position.x && dy === gameState.player.position.y;
            });
            // Check if player is ADJACENT to a door
            const doorNearPlayer = doors.find(d => {
                const dx = d.position ? d.position.x : d.x;
                const dy = d.position ? d.position.y : d.y;
                return Math.abs(dx - gameState.player.position.x) + Math.abs(dy - gameState.player.position.y) === 1;
            });

            // --- Reprioritized Contextual Logic ---
            const posStr = `Pos: (${gameState.player.position.x}, ${gameState.player.position.y})`;
            
            if (adjacentEnemies.length > 0) {
                actionButton.textContent = 'Fight';
                actionButton.disabled = false;
                console.warn(`[ACTION] Fight available at ${posStr}`);
            } else if (hasTreasureAtPos) {
                actionButton.textContent = 'Loot';
                actionButton.disabled = false;
            } else if (adjacentNPCs.length > 0) {
                actionButton.textContent = 'Talk';
                actionButton.disabled = false;
            } else if (doorAtPlayer) {
                actionButton.textContent = 'Exit';
                actionButton.disabled = false;
                console.warn(`[ACTION] Exit available at ${posStr}`);
            } else if (doorNearPlayer && doorNearPlayer.isLocked) {
                actionButton.textContent = 'Locked';
                actionButton.disabled = true;
            } else {
                actionButton.textContent = 'Search';
                actionButton.disabled = false;
            }
        }

        // Cleanup old visual effects
        if (gameState.visualEffects && gameState.visualEffects.length > 0) {
            const now = Date.now();
            gameState.visualEffects = gameState.visualEffects.filter(ef => (now - (ef.startTime || now)) < 1200);
        }

        renderer.draw(gameState);
        requestAnimationFrame(loop);
    }
    loop();
}

/**
 * Handles the contextual primary action button based on current game state.
 */
function handleContextualAction() {
    if (!gameState || gameState.gameStatus !== 'playing') return;

    const adjacentEnemies = getAdjacentEnemies(gameState);
    const adjacentNPCs = getAdjacentNPCs(gameState);
    const hasTreasureAtPos = gameState.currentRoom.treasures.some(t => t.position.x === gameState.player.position.x && t.position.y === gameState.player.position.y);
    const atExit = canExit(gameState);
    
    const doors = gameState.currentRoom.doors || (gameState.currentRoom.layout && gameState.currentRoom.layout.doors) || [];
    const doorNearPlayer = doors.find(d => {
        const dx = d.position ? d.position.x : d.x;
        const dy = d.position ? d.position.y : d.y;
        return (dx === gameState.player.position.x && dy === gameState.player.position.y) ||
               (Math.abs(dx - gameState.player.position.x) + Math.abs(dy - gameState.player.position.y) === 1);
    });

    if (adjacentEnemies.length > 0) {
        handleFight();
    } else if (hasTreasureAtPos) {
        handleSearch();
    } else if (adjacentNPCs.length > 0) {
        handleTalk();
    } else if (atExit || doorNearPlayer) {
        handleExit();
    } else {
        handleSearch();
    }
}

export function setupInputListeners() {
    document.removeEventListener('keydown', handleKeydown);
    document.addEventListener('keydown', handleKeydown);
}

function handleKeydown(e) {
    if (!gameState || gameState.gameStatus !== 'playing') return;
    let dx = 0, dy = 0;
    switch (e.key) {
        case 'ArrowUp': case 'w': dy = -1; break;
        case 'ArrowDown': case 's': dy = 1; break;
        case 'ArrowLeft': case 'a': dx = -1; break;
        case 'ArrowRight': case 'd': dx = 1; break;
        case 'f': handleFight(); break;
        case 't': handleTalk(); break;
        case 'e': handleSearch(); break;
        case 'x': handleExit(); break;
        case 'Enter': case ' ': 
            const actionButton = document.getElementById('action-button');
            if (actionButton && !actionButton.disabled) {
                actionButton.click();
            }
            break;
        default: return;
    }
    e.preventDefault();
    if (dx !== 0 || dy !== 0) {
        handleMove(dx, dy);
    }
}

function handleMove(dx, dy) {
    if (gameState.gameStatus !== 'playing' || gameState.turn.ap < 1) return;

    const blockedMessage = isPathBlocked(gameState, dx, dy);
    if (blockedMessage) {
        const newGameState = JSON.parse(JSON.stringify(gameState));
        newGameState.message = blockedMessage;
        gameState = newGameState;
        return;
    }

    gameState.visualEffects = [];
    gameState = executeMove(gameState, dx, dy);
    soundManager.playMove();
    
    if (gameState.turn.ap <= 0 && gameState.gameStatus === 'playing') {
        endTurn();
    }
}

function handleFight() {
    if (canFight(gameState)) {
        gameState.visualEffects = [];
        gameState = executeFight(gameState);
        soundManager.playHit();
        checkGameOver();
        if (gameState.turn.ap <= 0 && gameState.gameStatus === 'playing') {
            endTurn();
        }
    }
}

function handleTalk() {
    if (canInteract(gameState)) { 
        gameState.visualEffects = [];
        gameState = executeInteract(gameState);
        if (gameState.turn.ap <= 0 && gameState.gameStatus === 'playing') {
            endTurn();
        }
    }
}

function handleSearch() {
    if (canSearch(gameState)) {
        const oldTreasureCount = gameState.currentRoom.treasures.length;
        const oldHp = gameState.player.hp;

        gameState.visualEffects = [];
        gameState = executeSearch(gameState);
        
        // Determine which sound to play
        if (gameState.player.hp < oldHp) {
            soundManager.playTrap();
        } else if (gameState.currentRoom.treasures.length < oldTreasureCount) {
            // Check for heal vs normal treasure
            if (gameState.message.toLowerCase().includes('heal') || gameState.message.toLowerCase().includes('potion')) {
                soundManager.playHeal();
            } else {
                soundManager.playTreasure();
            }
        }

        checkGameOver();
        if (gameState.turn.ap <= 0 && gameState.gameStatus === 'playing') {
            endTurn();
        }
    }
}

function handleExit() {
    if (canExit(gameState)) {
        gameState = executeExit(gameState);
        soundManager.playMove();
        checkGameOver();
    } else {
        const { currentRoom, player } = gameState;
        const doors = currentRoom.doors || (currentRoom.layout && currentRoom.layout.doors) || [];
        const doorAtPosition = doors.find(d => {
            const dx = d.position ? d.position.x : d.x;
            const dy = d.position ? d.position.y : d.y;
            return (dx === player.position.x && dy === player.position.y) ||
                   (Math.abs(dx - player.position.x) + Math.abs(dy - player.position.y) === 1);
        });

        const newGameState = JSON.parse(JSON.stringify(gameState));
        if (doorAtPosition && doorAtPosition.isLocked) {
            newGameState.message = "The door is locked.";
        } else if (currentRoom.enemies.filter(e => e.hp > 0).length > 0) {
            newGameState.message = "You cannot exit while enemies are present!";
        } else if (!doorAtPosition) {
            newGameState.message = "You are not near a door.";
        }
        gameState = newGameState;
    }
}

function endTurn() {
    gameState = endPlayerTurn(gameState);
    checkGameOver();
}

function checkGameOver() {
    if (gameState.player.hp <= 0 && gameState.gameStatus === 'playing') {
        gameState = {
            ...gameState,
            gameStatus: 'lost',
            message: 'You have fallen in the dungeon.'
        };
        soundManager.playLoss();
    } else if (gameState.gameStatus === 'won') {
        soundManager.playWin();
    }
}

export function handleGoHome() {
    gameState = null;
    gameLoopRunning = false;
}
