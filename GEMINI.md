# Gemini Mandates: Top-down Explorer

This file defines the foundational engineering standards, architectural patterns, and project-specific rules for the **Top-down Explorer** (HeroQuest Browser Game). These mandates take precedence over general defaults.

## 1. Architectural Mandates

### State Management
- **Immutability:** Never mutate the `gameState` directly. Always return a new state object.
- **Deep Cloning:** Use `JSON.parse(JSON.stringify(gameState))` (or `structuredClone` if environment-safe) within `actionExecutor.js` to ensure deep copies before modification.
- **Centralization:** The single source of truth is `src/game/gameState.js`. All game logic must flow through this state.

### Action Pattern
- **Separation of Concerns:** Maintain the strict split between validation and execution:
  - `src/game/actionValidator.js`: Boolean checks only (`canMove`, `canFight`).
  - `src/game/actionExecutor.js`: State transformations only (`executeMove`, `executeFight`).
- **AP Economy:** Every player action must deduct Action Points (AP) as defined in `ACTION_COSTS` within `gameState.js`.

## 2. Coding & Implementation Standards

### Rendering & UI
- **Canvas for Game Board:** All gameplay elements (player, enemies, grid, walls) must be rendered via the HTML5 Canvas in `src/renderer/renderer.js`.
- **React for Overlays:** Use React components (`src/ui-screens/`) for menus, intro screens, and HUD elements that sit outside the game grid.
- **Emoji Visuals:** Adhere to the established visual set:
  - 🧙 Player, 👹 Goblin, 👻 Ghost, 🐷 Orc, 🐉 Fire Dragon (Boss), ✨ Treasure.

### Enemy AI
- **Pathfinding:** Use **Manhattan distance** for enemy pursuit logic as implemented in `src/utils/helpers.js` (`findNextStep`). Do not introduce complex A* algorithms unless explicitly requested.

### Data & Quests
- **Modular Data:** Keep enemy stats, treasure tables, and quest definitions in `src/data/`.
- **Quest Schema:** New quests must follow the schema in `src/data/quests/`, including definitions for rooms, enemy spawns, and win conditions.

## 3. Workflow Mandates

### Development Tools
- **Quest Editor:** Utilize the local quest editor for complex dungeon design. Run it via:
  ```bash
  npm run dev:editor
  ```
- **Validation:** When adding new mechanics, always verify they don't break the "Search" constraint (cannot search if enemies are present) or "Exit" constraint (cannot leave room if enemies are present).

### Performance
- **Asset-less Design:** Do not add external image assets. Continue using code-generated shapes and emojis to maintain the retro arcade aesthetic and zero-load-time performance.

## 4. Documentation
- Update `PROJECT_OVERVIEW.md` when adding new core modules.
- Ensure `heroquest_prd.md` remains the source of truth for game rules and mechanics.
