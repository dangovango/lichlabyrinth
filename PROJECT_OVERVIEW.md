# Project Overview

This document provides a high-level overview of the project structure, organized by functionality. Use this as a reference to quickly locate files when making changes or troubleshooting.

### Content Loading & Data

If you need to adjust quest data, add new enemies, or change how content is loaded into the game, refer to these files:

*   **`src/data/quests/`**: A directory containing modular quest definitions (e.g., `dragon-hoard.js`, `chamber-of-gears.js`). Each file defines a quest's rooms, enemy spawns, and win conditions. The `index.js` file aggregates these for use in the game.
*   **`src/data/enemies.js`**: Contains the base stats and types for all enemies in the game.
*   **`src/data/treasures.js`**: Defines different types of treasures and traps that can be found.
*   **`src/game/questManager.js`**: Handles the logic for loading a specific quest and transitioning the player between rooms.
*   **`src/game/roomGenerator.js`**: Responsible for generating a room's layout, and placing enemies and treasures within it.

### UI & Rendering

For any visual changes, from updating the layout to changing how the game is rendered on the canvas, these are the files to look at:

*   **`src/App.jsx`**: The main React component that controls which screen is currently visible (e.g., home screen, game screen, game over screen).
*   **`src/ui-screens/` (directory)**: Contains the individual React components for each major UI screen like `HomeScreen.jsx` and `QuestNumberScreen.jsx`.
*   **`GameOverScreen.jsx`**: The component for the "Game Over" and "Victory" screen.
*   **`src/renderer/renderer.js`**: Handles all drawing on the HTML canvas, including the player, enemies, and the room layout.
*   **`src/renderer/ui.js`**: Manages the HTML-based UI elements outside the canvas, such as player stats, the message log, and action buttons.
*   **`style.css`**: Contains all the CSS styles for the application.

### Game Mechanics & Systems

If you want to alter core game rules, like action costs, combat calculations, or how turns are resolved, these files contain the core logic:

*   **`src/game/gameState.js`**: Defines the initial structure of the game's state, including player stats and turn information.
*   **`src/game/actionExecutor.js`**: Implements the logic for what happens when an action is taken (e.g., `executeMove`, `executeFight`).
*   **`src/game/actionValidator.js`**: Contains functions that check if an action is currently possible (e.g., if a player has enough AP, if a path is blocked).
*   **`src/game/turnResolver.js`**: Manages the game's turn order, ending the player's turn and triggering enemy actions.
*   **`src/utils/helpers.js`**: A collection of utility functions, including the pathfinding logic for enemies (`findNextStep`).
