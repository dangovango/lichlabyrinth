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
    <div style={styles.container}>
      <div style={styles.topRightControls}>
        <button onClick={onShowSettings} style={styles.settingsBtn} title="Settings">⚙️</button>
      </div>
      
      <div style={styles.contentWrapper}>
        <div style={styles.leftColumn}>
          <img src="/title-image.png" alt="The Lich's Labyrinth" style={styles.titleImage} />
        </div>

        <div style={styles.rightColumn}>
          <div style={styles.statsPanel}>
            <h2 style={styles.statsTitle}>Hero Status</h2>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>HP: <span style={styles.statValue}>{playerData.hp}/{playerData.maxHp}</span></div>
              <div style={styles.statItem}>Attack: <span style={styles.statValue}>{playerData.attack}</span></div>
              <div style={styles.statItem}>Actions: <span style={styles.statValue}>{playerData.apTotal || 6}</span></div>
              <div style={styles.statItem}>Wealth: <span style={styles.statValue}>{playerData.gold || 0} G</span></div>
              <div style={styles.statItem}>Cleared: <span style={styles.statValue}>{playerData.completedQuests?.length || 0}</span></div>
            </div>
          </div>

          <div style={styles.buttonContainer}>
            <button onClick={onStartGame} style={styles.startButton}>
              Start Quest
            </button>
            <button onClick={handleReset} style={styles.resetButton}>
              Reset Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#1a1510',
    color: 'white',
    fontFamily: '"Georgia", serif',
    padding: '40px',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
  },
  topRightControls: {
    position: 'absolute',
    top: '30px',
    right: '30px',
    zIndex: 10,
  },
  settingsBtn: {
    background: 'rgba(43, 27, 23, 0.8)',
    border: '2px solid #8b4513',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#FFD700',
    padding: '12px',
    borderRadius: '50%',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
  },
  contentWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: '50px',
    width: '100%',
    maxWidth: '1100px',
    backgroundColor: 'rgba(26, 21, 16, 0.9)',
    padding: '40px',
    borderRadius: '12px',
    border: '1px solid rgba(139, 69, 19, 0.3)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
  },
  leftColumn: {
    flex: '1.2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightColumn: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '30px',
  },
  titleImage: {
    width: '100%',
    height: 'auto',
    borderRadius: '8px',
    border: '4px solid #8b4513',
    boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(255, 140, 0, 0.1)',
  },
  statsPanel: {
    backgroundColor: '#2b1b17',
    padding: '25px',
    borderRadius: '4px',
    border: '2px solid #8b4513',
    borderImage: 'linear-gradient(to bottom, #ffd700, #8b4513, #3e2723) 1',
    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
  },
  statsTitle: {
    fontSize: '1.2rem',
    color: '#FFD700',
    marginTop: 0,
    marginBottom: '20px',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
    paddingBottom: '10px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
    fontSize: '1.1rem',
  },
  statItem: {
    color: '#d7ccc8',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
  },
  statValue: {
    color: 'white',
    fontWeight: 'bold',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  startButton: {
    padding: '18px 40px',
    fontSize: '1.4rem',
    background: 'radial-gradient(circle, #ff6d00 0%, #bf360c 100%)',
    color: 'white',
    border: '2px solid #ffd700',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    boxShadow: '0 5px 15px rgba(0,0,0,0.4)',
    fontFamily: 'inherit',
    transition: 'all 0.1s ease',
  },
  resetButton: {
    padding: '12px 20px',
    fontSize: '0.9rem',
    backgroundColor: 'transparent',
    color: '#8b4513',
    border: '1px solid #3e2723',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  }
};

export default HomeScreen;
