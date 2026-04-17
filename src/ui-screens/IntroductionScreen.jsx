import React from 'react';

const IntroductionScreen = ({ quest, onContinue }) => {
  const name = quest?.name || "New Quest";
  const description = quest?.description || "A dangerous challenge awaits you in the depths of the dungeon. Steel your nerves and proceed with caution.";

  return (
    <div className="intro-overlay">
      <div className="intro-container">
        <div className="intro-scroll-icon">📜</div>
        <h2 className="intro-welcome">The Call to Adventure</h2>
        <h1 className="intro-title">{name}</h1>
        <div className="intro-divider">
          <div className="intro-divider-glow"></div>
        </div>
        <p className="intro-description">{description}</p>
        <button onClick={onContinue} className="intro-button">
          Begin Mission
        </button>
      </div>
    </div>
  );
};

export default IntroductionScreen;
