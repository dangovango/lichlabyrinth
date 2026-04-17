import React, { useState, useEffect } from 'react';
import { loadPlayerData, clearPlayerData, DEFAULT_PLAYER_STATS } from '../utils/persistence.js';

const HomeScreen = ({ onStartGame, onShowSettings }) => {
  const [playerData, setPlayerData] = useState(DEFAULT_PLAYER_STATS);

  useEffect(() => {
    setPlayerData(loadPlayerData());
  }, []);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all progress? Your stats and completed quests will be lost.")) {
      clearPlayerData();
      setPlayerData(loadPlayerData());
    }
  };

  return (
    <div className="home-container">
      <div className="top-right-controls">
        <button onClick={onShowSettings} className="settings-btn" title="Settings">⚙️</button>
      </div>
      
      <div className="home-content-wrapper">
        <div className="home-left-column">
          <img src="/title-image.png" alt="The Lich's Labyrinth" className="home-title-image" />
        </div>

        <div className="home-right-column">
          <div className="home-stats-panel">
            <h2 className="home-stats-title">Hero Status</h2>
            <div className="home-stats-grid">
              <div className="home-stat-item">HP: <span className="home-stat-value">{playerData.hp}/{playerData.maxHp}</span></div>
              <div className="home-stat-item">Attack: <span className="home-stat-value">{playerData.attack}</span></div>
              <div className="home-stat-item">Actions: <span className="home-stat-value">{playerData.apTotal || 6}</span></div>
              <div className="home-stat-item">Wealth: <span className="home-stat-value">{playerData.gold || 0} G</span></div>
              <div className="home-stat-item">Cleared: <span className="home-stat-value">{playerData.completedQuests?.length || 0}</span></div>
            </div>
          </div>

          <div className="home-button-container">
            <button onClick={onStartGame} className="home-start-button">
              Start Quest
            </button>
            <button onClick={handleReset} className="home-reset-button">
              Reset Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
