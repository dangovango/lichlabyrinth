import React, { useState, useEffect } from 'react';
import questsData from '../data/quests/index.js';
import { loadPlayerData } from '../utils/persistence.js';

const QuestNumberScreen = ({ onStartQuest }) => {
  const [quests, setQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);

  useEffect(() => {
    // Load quests from data
    setQuests(Object.values(questsData));
    
    // Load completed quest IDs from persistence
    const playerData = loadPlayerData();
    setCompletedQuests(playerData.completedQuests || []);
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const quest = JSON.parse(e.target.result);
        onStartQuest(quest); // Pass the loaded quest to the parent handler
      } catch (err) {
        alert('Failed to parse quest file. Make sure it is a valid JSON file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <h2 style={styles.title}>Choose Your Quest</h2>
        <p style={styles.message}>
          Select a quest from the scrolls below or load your own.
        </p>
        <div style={styles.questList}>
          {quests.map((quest) => {
            const isCompleted = completedQuests.includes(quest.questId);
            return (
              <button
                key={quest.questId}
                onClick={() => onStartQuest(quest)}
                style={{
                  ...styles.questButton,
                  ...(isCompleted ? styles.completedQuestButton : {})
                }}
              >
                <div style={styles.questInfo}>
                  <span style={styles.questName}>{quest.name}</span>
                  {isCompleted && <span style={styles.completedBadge}>💠 COMPLETED</span>}
                </div>
                <div style={styles.questArrow}>▶</div>
              </button>
            );
          })}
        </div>
        
        <div style={styles.footer}>
          <label htmlFor="quest-file-input" style={styles.loadButton}>
            📜 Load Secret Scroll
          </label>
          <input
            type="file"
            id="quest-file-input"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(13, 10, 8, 0.95)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(8px)',
  },
  container: {
    textAlign: 'center',
    color: '#d7ccc8',
    fontFamily: '"Georgia", serif',
    padding: '40px',
    border: '3px solid #8b4513',
    borderImage: 'linear-gradient(to bottom, #ffd700, #8b4513, #3e2723) 1',
    backgroundColor: '#1a1510',
    borderRadius: '4px',
    maxWidth: '600px',
    width: '90%',
    boxShadow: '0 20px 50px rgba(0,0,0,0.9), inset 0 0 30px rgba(0,0,0,0.5)',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '15px',
    color: '#ff8c00',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    textShadow: '2px 2px 0px #000, 0 0 10px rgba(255, 140, 0, 0.3)',
  },
  message: {
    fontSize: '1rem',
    color: '#a1887f',
    marginBottom: '30px',
    fontStyle: 'italic',
  },
  questList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '30px',
    maxHeight: '400px',
    overflowY: 'auto',
    paddingRight: '15px',
  },
  questButton: {
    padding: '20px 25px',
    fontSize: '1.2rem',
    backgroundColor: '#3e2723',
    backgroundImage: 'linear-gradient(135deg, #3e2723 0%, #2b1b17 100%)',
    color: '#ffd700',
    border: '1px solid #8b4513',
    borderRadius: '4px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'inherit',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
  },
  completedQuestButton: {
    border: '1px solid #4CAF50',
    backgroundImage: 'linear-gradient(135deg, #1b3a1b 0%, #0d1a0d 100%)',
    color: '#8f8',
  },
  questInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  questName: {
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  questArrow: {
    opacity: 0.5,
    fontSize: '0.8rem',
  },
  completedBadge: {
    fontSize: '0.7rem',
    color: '#4CAF50',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: '4px 10px',
    borderRadius: '20px',
    border: '1px solid #4CAF50',
    fontWeight: 'normal',
  },
  footer: {
    borderTop: '1px solid #3e2723',
    paddingTop: '25px',
  },
  loadButton: {
    display: 'inline-block',
    padding: '12px 25px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#ffd700',
    border: '1px solid #8b4513',
    borderRadius: '4px',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    letterSpacing: '1px',
  },
};

export default QuestNumberScreen;
