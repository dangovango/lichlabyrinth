import React, { useState, useEffect, useRef } from 'react';
import HomeScreen from './ui-screens/HomeScreen.jsx';
import IntroductionScreen from './ui-screens/IntroductionScreen.jsx';
import QuestNumberScreen from './ui-screens/QuestNumberScreen.jsx';
import GameOverScreen from '../GameOverScreen.jsx';

// Import game logic from the new controller
import { startGame as coreGameStart, gameState as coreGameState, handleGoHome as coreHandleGoHome, setupInputListeners as coreSetupInputListeners } from './game/gameController.js';
import { soundManager } from './utils/audio.js';

// --- Global Game State Access (for now) ---
// We'll use a ref to hold the gameState and expose it to child components if needed.
// The core game logic directly manipulates this global gameState.
// Ideally, this would be managed by React Context or a state management library.
let currentGameState = null;
let gameLoopInterval = null;


const RootComponent = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [gameOverState, setGameOverState] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    showHealthBars: true,
    showEmbers: true,
    showBossPresence: true,
    screenShake: true,
    volume: 0.4,
    isMuted: false
  });
  const inputListenersSetup = useRef(false);
  const gameContainerRef = useRef(null);
  const gameOverTimeoutRef = useRef(null);

  // Effect to initialize audio on first load/interaction
  useEffect(() => {
    const startMusic = () => {
      soundManager.init();
      soundManager.resume();
      soundManager.startAmbientMusic();
    };

    // Try to start immediately (might be blocked)
    startMusic();

    // Also start on first click as a fallback for browser auto-play policies
    window.addEventListener('click', startMusic, { once: true });
    window.addEventListener('keydown', startMusic, { once: true });

    return () => {
      window.removeEventListener('click', startMusic);
      window.removeEventListener('keydown', startMusic);
    };
  }, []);

  // --- Screen Transition Handlers ---
  const handleStartGame = () => {
    setCurrentScreen('quest-number');
  };

  const handleStartQuest = (quest) => {
    setSelectedQuest(quest);
    setCurrentScreen('introduction');
    // Clear any pending timeout on restart
    if (gameOverTimeoutRef.current) {
      clearTimeout(gameOverTimeoutRef.current);
      gameOverTimeoutRef.current = null;
    }
  };

  const handleBeginMission = () => {
    // Initialize audio on first user gesture
    soundManager.init();
    soundManager.resume();
    soundManager.startAmbientMusic();

    currentGameState = null; // Reset global state reference for fresh start
    setCurrentScreen('game-play');
    setGameOverState(null); // Reset game over state
  };

  const handleGoHome = () => {
    setCurrentScreen('home');
    setSelectedQuest(null);
    setGameOverState(null);
    if (gameOverTimeoutRef.current) {
      clearTimeout(gameOverTimeoutRef.current);
      gameOverTimeoutRef.current = null;
    }
    coreHandleGoHome(); // Cleanup in main.js
    // Resetting inputListenersSetup might be needed if listeners are removed upon leaving game-play
    // inputListenersSetup.current = false;
    currentGameState = null; // Clear global state reference
  };

  const handleToggleMute = () => {
    const newMuteState = soundManager.toggleMute();
    setSettings(prev => ({ ...prev, isMuted: newMuteState }));
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setSettings(prev => ({ ...prev, volume: newVolume }));
    soundManager.setVolume(newVolume);
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Sync settings with core game logic
  useEffect(() => {
    if (coreGameState) {
      coreGameState.settings = settings;
    }
  }, [settings, coreGameState]);

  // Monitor game state for game over
  useEffect(() => {
    if (currentScreen !== 'game-play') return;

    const interval = setInterval(() => {
        // Access coreGameState directly from the imported live binding
        if (coreGameState && coreGameState.gameStatus && coreGameState.gameStatus !== 'playing') {
            // Only set timeout if it's not already pending
            if (!gameOverTimeoutRef.current && !gameOverState) {
                const displayMessage = coreGameState.gameStatus === 'won' 
                    ? (coreGameState.quest.victoryMessage || coreGameState.message)
                    : coreGameState.message;

                gameOverTimeoutRef.current = setTimeout(() => {
                    setGameOverState({ status: coreGameState.gameStatus, message: displayMessage });
                    gameOverTimeoutRef.current = null;
                }, 1500); // 1.5 second delay to let visual effects play out
            }
        } else if (coreGameState && coreGameState.gameStatus === 'playing') {
            // Ensure gameOverState is null if the game is active (handles restarts)
            if (gameOverTimeoutRef.current) {
                clearTimeout(gameOverTimeoutRef.current);
                gameOverTimeoutRef.current = null;
            }
            setGameOverState(null);
        }
    }, 100); // Slightly faster check for better responsiveness

    return () => {
        clearInterval(interval);
        if (gameOverTimeoutRef.current) {
            clearTimeout(gameOverTimeoutRef.current);
        }
    };
  }, [currentScreen, selectedQuest, gameOverState]);

  // Effect to control visibility of #quest-loader and #game-container and start game
  useEffect(() => {
    const questLoader = document.getElementById('quest-loader');
    const gameContainer = document.getElementById('game-container');

    // Logic to control visibility of different screen containers
    if (currentScreen === 'home') {
      // Ensure home screen is visible, and others are hidden
      if (questLoader) questLoader.style.display = 'none';
      if (gameContainer) gameContainer.style.display = 'none';
      // Assuming HomeScreen itself renders its content within the root div managed by React
    } else if (currentScreen === 'quest-number') {
      if (questLoader) questLoader.style.display = 'block';
      if (gameContainer) gameContainer.style.display = 'none';
    } else if (currentScreen === 'game-play') {
      if (questLoader) questLoader.style.display = 'none';
      if (gameContainer) gameContainer.style.display = 'flex';

      // Start game logic only when entering 'game-play' screen and a quest is selected
      // and it hasn't been started yet in this render cycle.
      if (selectedQuest && !currentGameState) { // Use currentGameState to prevent re-initialization on re-renders
          coreGameStart(selectedQuest);
          currentGameState = coreGameState; // Update global state reference
          coreSetupInputListeners();
          inputListenersSetup.current = true;
      }
    } else { // For introduction screen and any other future screens
      if (questLoader) questLoader.style.display = 'none';
      if (gameContainer) gameContainer.style.display = 'none';
    }

    // Cleanup listeners when leaving game-play state
    // This cleanup might need to be more sophisticated if listeners are attached to specific elements
    // that are removed from the DOM. For now, it relies on checks within the listener itself.
    if (currentScreen !== 'game-play' && inputListenersSetup.current) {
        // In main.js, setupInputListeners adds a keydown listener to `document`.
        // If we need to remove it, we'd need access to the listener function itself.
        // For now, the check `if (!gameState || gameState.gameStatus !== 'playing') return;` in main.js
        // handles not processing input when not in game-play.
    }
  }, [currentScreen, selectedQuest, currentGameState]); // Depend on currentScreen, selectedQuest, and currentGameState to trigger logic correctly.

  const renderSettingsMenu = () => (
    <div className="settings-overlay">
      <div className="settings-container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="settings-title">Settings</h1>
          <button onClick={() => setShowSettings(false)} className="close-btn">✕</button>
        </div>
        
        <div className="settings-section">
          <h3>AUDIO</h3>
          <div className="setting-item">
            <span>Volume</span>
            <div className="flex items-center gap-4">
              <button onClick={handleToggleMute} className="audio-icon-btn">
                {settings.isMuted ? '🔇' : '🔊'}
              </button>
              <input 
                type="range" min="0" max="1" step="0.05" 
                value={settings.volume} onChange={handleVolumeChange} 
                className="volume-slider"
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>VISUALS</h3>
          <div className="setting-item">
            <span>Show Health Bars</span>
            <label className="switch">
              <input type="checkbox" checked={settings.showHealthBars} onChange={() => toggleSetting('showHealthBars')} />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="setting-item">
            <span>Show Embers</span>
            <label className="switch">
              <input type="checkbox" checked={settings.showEmbers} onChange={() => toggleSetting('showEmbers')} />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="setting-item">
            <span>Show Boss Presence</span>
            <label className="switch">
              <input type="checkbox" checked={settings.showBossPresence} onChange={() => toggleSetting('showBossPresence')} />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="setting-item">
            <span>Screen Shake</span>
            <label className="switch">
              <input type="checkbox" checked={settings.screenShake} onChange={() => toggleSetting('screenShake')} />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGameUI = () => (
    <>
      <div id="left-column">
        <div id="player-stats-panel">
          <div className="flex justify-between items-center mb-2">
            <h2>PLAYER</h2>
            <button onClick={() => setShowSettings(true)} className="settings-btn" title="Settings">⚙️</button>
          </div>
          <div id="stats-content">
            <p>HP: <span id="player-hp">--</span> / <span id="player-max-hp">--</span></p>
            <p>Actions: <span id="player-ap">--</span> / <span id="player-ap-total">--</span></p>
            <p>Attack: <span id="player-attack">--</span></p>
            <p>Gold: <span id="player-gold">--</span></p>
          </div>
        </div>
        
        <div id="movement-section">
          <div id="movement-controls">
            <button id="move-up" className="move-btn d-pad-up"><span>↑</span></button>
            <button id="move-left" className="move-btn d-pad-left"><span>←</span></button>
            <button id="move-right" className="move-btn d-pad-right"><span>→</span></button>
            <button id="move-down" className="move-btn d-pad-down"><span>↓</span></button>
          </div>
        </div>
      </div>

      <div id="center-column">
        <h1 id="room-name">Loading...</h1>
        <div id="canvas-container">
          <canvas id="game-canvas"></canvas>
          <div id="torch-gauge-hud">
            <div id="torch-gauge-fill"></div>
          </div>
          <div id="message-log-overlay">
            <p id="log-message">Preparing dungeon...</p>
          </div>
        </div>
        <h2 id="quest-name">--</h2>
      </div>

      <div id="right-column">
        <div id="objectives-panel">
          <h2>OBJECTIVES</h2>
          <div id="objectives-content">
            <div className="objective-item">
              <div className="objective-bullet"></div>
              <span>Initializing goals...</span>
            </div>
          </div>
        </div>

        <div id="primary-action-section">
          <button id="action-button" className="primary-action-btn">Action</button>
        </div>
      </div>
    </>
  );

  return (
    <div className="app-container">
      {/* Global Settings Menu */}
      {showSettings && renderSettingsMenu()}

      {/* Render HomeScreen when currentScreen is 'home' */}
      {currentScreen === 'home' && <HomeScreen onStartGame={handleStartGame} onShowSettings={() => setShowSettings(true)} />}
      {currentScreen === 'introduction' && <IntroductionScreen quest={selectedQuest} onContinue={handleBeginMission} />}
      {currentScreen === 'quest-number' && <QuestNumberScreen onStartQuest={handleStartQuest} />}
      
      {/* Game Play Screen - Renders the core game UI elements */}
      {currentScreen === 'game-play' && (
        <div ref={gameContainerRef} id="game-container">
          {renderGameUI()}
          {gameOverState && (
            <GameOverScreen 
              gameStatus={gameOverState.status}
              victoryMessage={gameOverState.message}
              onRestart={handleStartQuest.bind(null, selectedQuest)} // Pass current quest for restart
              onGoHome={handleGoHome}
            />
          )}
        </div>
      )}
    </div>
  );
};
export default RootComponent;
