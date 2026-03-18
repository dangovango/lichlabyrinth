import React from 'react';

const GameOverScreen = ({ gameStatus, onRestart, onGoHome, victoryMessage }) => {
  if (gameStatus === 'playing') return null;

  const isWin = gameStatus === 'won';

  return (
    <div className="game-over-fade-in" style={styles.overlay}>
      <div style={{
        ...styles.container,
        borderImage: isWin 
          ? 'linear-gradient(to bottom, #ffd700, #4caf50, #1b3a1b) 1'
          : 'linear-gradient(to bottom, #ff4444, #8b0000, #2b1b17) 1',
        boxShadow: isWin
          ? '0 20px 50px rgba(76, 175, 80, 0.3), inset 0 0 30px rgba(0,0,0,0.5)'
          : '0 20px 50px rgba(255, 68, 68, 0.2), inset 0 0 30px rgba(0,0,0,0.5)'
      }}>
        <div style={styles.icon}>{isWin ? '🏆' : '💀'}</div>
        
        <h1 style={{ 
          ...styles.title, 
          color: isWin ? '#ffd700' : '#ff4444',
          textShadow: isWin 
            ? '0 0 20px rgba(255, 215, 0, 0.5), 2px 2px 0px #000'
            : '0 0 20px rgba(255, 68, 68, 0.5), 2px 2px 0px #000'
        }}>
          {isWin ? 'VICTORY!' : 'YOU DIED'}
        </h1>
        
        <p style={styles.message}>
          {isWin
            ? (victoryMessage || 'The Labyrinth is conquered! Your name shall be sung in the halls of legends.')
            : 'Your journey ends here. The darkness consumes another brave soul.'}
        </p>
        
        <div style={styles.buttonContainer}>
          <button onClick={onRestart} style={{
            ...styles.button,
            background: isWin 
              ? 'radial-gradient(circle, #4caf50 0%, #1b3a1b 100%)'
              : 'radial-gradient(circle, #ff6d00 0%, #bf360c 100%)',
            borderColor: isWin ? '#8f8' : '#ffd700'
          }}>
            Try Again
          </button>
          <button onClick={onGoHome} style={styles.secondaryButton}>
            Return Home
          </button>
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
    zIndex: 2000,
    backdropFilter: 'blur(10px)',
  },
  container: {
    textAlign: 'center',
    color: '#d7ccc8',
    fontFamily: '"Georgia", serif',
    padding: '50px 40px',
    border: '3px solid #8b4513',
    backgroundColor: '#1a1510',
    borderRadius: '4px',
    maxWidth: '500px',
    width: '90%',
  },
  icon: {
    fontSize: '4rem',
    marginBottom: '20px',
    filter: 'drop-shadow(0 0 15px rgba(0,0,0,0.5))',
  },
  title: {
    fontSize: 'clamp(2.5rem, 8vw, 4rem)',
    marginBottom: '20px',
    textTransform: 'uppercase',
    letterSpacing: '4px',
    fontWeight: 'bold',
  },
  message: {
    fontSize: '1.1rem',
    marginBottom: '40px',
    lineHeight: '1.6',
    fontStyle: 'italic',
    color: '#a1887f',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
  },
  button: {
    padding: '15px 40px',
    fontSize: '1.2rem',
    color: 'white',
    border: '2px solid',
    borderRadius: '50px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    fontFamily: 'inherit',
    boxShadow: '0 5px 15px rgba(0,0,0,0.4)',
    width: '100%',
    maxWidth: '280px',
    transition: 'transform 0.1s ease',
  },
  secondaryButton: {
    padding: '10px 20px',
    fontSize: '0.9rem',
    backgroundColor: 'transparent',
    color: '#ffd700',
    border: 'none',
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    fontFamily: 'inherit',
    letterSpacing: '1px',
    opacity: 0.7,
    transition: 'opacity 0.2s',
  }
};

export default GameOverScreen;