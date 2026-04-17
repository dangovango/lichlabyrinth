import React from 'react';

const GameOverScreen = ({ gameStatus, onRestart, onGoHome, victoryMessage }) => {
  if (gameStatus === 'playing') return null;

  const isWin = gameStatus === 'won';

  return (
    <div className={`game-over-fade-in game-over-overlay`} >
      <div className={`game-over-container ${isWin ? 'win' : 'loss'}`}>
        <div className="game-over-icon">{isWin ? '🏆' : '💀'}</div>
        
        <h1 className={`game-over-title ${isWin ? 'win' : 'loss'}`}>
          {isWin ? 'VICTORY!' : 'YOU DIED'}
        </h1>
        
        <p className="game-over-message">
          {isWin
            ? (victoryMessage || 'The Labyrinth is conquered! Your name shall be sung in the halls of legends.')
            : 'Your journey ends here. The darkness consumes another brave soul.'}
        </p>
        
        <div className="game-over-button-container">
          <button onClick={onRestart} className={`game-over-button ${isWin ? 'win' : 'loss'}`}>
            {isWin ? 'Next Quest' : 'Try Again'}
          </button>
          <button onClick={onGoHome} className="game-over-secondary-button">
            Return Home
          </button>
        </div>      </div>
    </div>
  );
};

export default GameOverScreen;