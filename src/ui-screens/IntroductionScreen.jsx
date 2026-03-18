import React from 'react';

const IntroductionScreen = ({ quest, onContinue }) => {
  const name = quest?.name || "New Quest";
  const description = quest?.description || "A dangerous challenge awaits you in the depths of the dungeon. Steel your nerves and proceed with caution.";

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.scrollIcon}>📜</div>
        <h2 style={styles.welcome}>The Call to Adventure</h2>
        <h1 style={styles.title}>{name}</h1>
        <div style={styles.divider}>
          <div style={styles.dividerGlow}></div>
        </div>
        <p style={styles.description}>{description}</p>
        <button onClick={onContinue} style={styles.button}>
          Begin Mission
        </button>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 10, 8, 0.95)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
    backdropFilter: 'blur(10px)',
  },
  container: {
    backgroundColor: '#1a1510',
    padding: '50px 40px',
    borderRadius: '4px',
    border: '3px solid #8b4513',
    borderImage: 'linear-gradient(to bottom, #ffd700, #8b4513, #3e2723) 1',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 50px rgba(0,0,0,0.9), inset 0 0 30px rgba(0,0,0,0.5)',
    color: '#d7ccc8',
    fontFamily: '"Georgia", serif',
  },
  scrollIcon: {
    fontSize: '3rem',
    marginBottom: '15px',
    filter: 'drop-shadow(0 0 10px rgba(255, 140, 0, 0.3))',
  },
  welcome: {
    color: '#8b4513',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    margin: '0 0 10px 0',
    fontWeight: 'bold',
  },
  title: {
    color: '#ff8c00',
    fontSize: '2.5rem',
    margin: '0 0 20px 0',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    textShadow: '2px 2px 0px #000, 0 0 10px rgba(255, 140, 0, 0.3)',
  },
  divider: {
    height: '2px',
    background: 'linear-gradient(to right, transparent, #8b4513, #ffd700, #8b4513, transparent)',
    width: '100%',
    margin: '0 auto 30px auto',
    position: 'relative',
  },
  dividerGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '40px',
    height: '10px',
    background: '#ff8c00',
    filter: 'blur(10px)',
    opacity: 0.5,
  },
  description: {
    color: '#a1887f',
    fontSize: '1.15rem',
    lineHeight: '1.7',
    margin: '0 0 40px 0',
    fontStyle: 'italic',
  },
  button: {
    padding: '15px 50px',
    fontSize: '1.3rem',
    background: 'radial-gradient(circle, #ff6d00 0%, #bf360c 100%)',
    color: 'white',
    border: '2px solid #ffd700',
    borderRadius: '50px',
    fontFamily: 'inherit',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.1s ease',
    boxShadow: '0 5px 15px rgba(0,0,0,0.4)',
  },
};

export default IntroductionScreen;
