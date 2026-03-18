# HeroQuest Browser Game - Product Requirements Document

## 1. Product Overview

**Title:** HeroQuest Browser Game (working title)

**Platform:** Browser-based, mobile-friendly

**Target Experience:** Light-weight, retro arcade aesthetic, turn-based dungeon crawler inspired by HeroQuest boardgame

**Core Loop:** Explore rooms on a 7x7 grid, defeat enemies, search for treasure, complete quest objectives

**Session Length:** 20-30 minutes per quest playthrough

**Release Strategy:** 
- Phase 1 (MVP): Single-quest, one-off playthrough, randomized room generation
- Phase 2 (Extended): Persistent progression across quests, map editor, predetermined dungeons, narrative elements

---

## 2. Core Gameplay Mechanics

### 2.1 Room Structure

- **Layout**: 7x7 square grid (49 total spaces)
- **Doors/Exits**: Center of each edge (4 total doorways per room)
  - Top-center: (3, 0)
  - Bottom-center: (3, 6)
  - Left-center: (0, 3)
  - Right-center: (6, 3)
- **Obstacles**: Walls, impassable terrain (randomly generated in MVP)
- **Traversability**: Player and enemies cannot occupy the same space; cannot move through walls or occupied spaces

### 2.2 Player Stats

**Persistent Across Rooms:**
- Health Points (HP) / Max HP
- Attack Power (base damage dealt)
- Movement Range (base squares per move action; starts at 6)
- Inventory (upgrades, items, consumables)

**Initial Values (MVP):**
- HP: 10 / Max 10
- Attack: 2
- Movement Range: 6
- Inventory: Empty

### 2.3 Action Economy

**Player Activation (Turn):**

The player performs actions during their activation. Each action type can only be performed **once per turn**. Actions include:

1. **Move**: Relocate up to N squares (default 6) in any cardinal direction to adjacent unoccupied, non-wall spaces. Cannot move through occupied spaces or walls.
   - Constraint: Available at any time during turn
   - Distance: Up to 6 squares total per move action

2. **Search for Treasure**: Examine current space for treasure or traps.
   - Constraint: Only if **no enemies are in the room**
   - Outcome: Discover reward, trap, or nothing
   - Consumes action even if result is trap/damage

3. **Fight Enemy**: Attack an adjacent enemy (within 1 space orthogonally or diagonally).
   - Constraint: Enemy must be present and adjacent
   - Combat resolution: Player attacks first; if enemy survives, enemy attacks player; other enemies then activate
   - Can be used to engage or disengage from combat

4. **Leave Room**: Exit through a doorway to the next room.
   - Constraint: No enemies in the room AND player must be adjacent to a doorway
   - Effect: Loads next room, resets room state, enemies repositioned

**Action Sequencing:**
- Player selects one action per activation
- Actions resolve in this order within a player turn: Move → Search → Fight → Exit
- No action chaining (cannot move + search in same activation)
- Each action type usable only once per turn

### 2.4 Enemy System

#### Spawn and Placement

- **Appearance**: Enemies spawn on room entry (when player enters the room)
- **Quantity**: Variable per room (determined by room definition or generator)
- **Position**: Randomly placed on non-doorway, non-player-spawn spaces
- **Types**: Multiple enemy types with different stats (Goblin, Ghost, Orc, Fire Dragon boss)

#### Enemy Stats

Each enemy has:
- Health Points (HP) / Max HP
- Attack Power (base damage dealt)
- Movement Range (0-3 spaces per activation)

#### Enemy Behavior

- **Activation**: All enemies activate once per round, in a pre-determined order (randomly assigned on room load, persists)
- **Turn Actions**: Move toward player using Manhattan distance pathfinding; attack if adjacent
- **Combat**: If player initiates fight, enemy takes damage first. If enemy survives, enemy attacks player. If multiple enemies present, all alive enemies activate in order before player's next turn.
- **Death**: Enemy is removed from room when HP ≤ 0
- **Disengagement**: Enemy cannot be "shaken off" by player movement; if player moves away, enemy pursues on their next activation using pathfinding

#### Combat Resolution

**Standard Combat Flow:**

1. Player activates and chooses "Fight Enemy"
2. Player deals damage to target enemy (damage = player Attack + random modifier)
3. If enemy survives (HP > 0), enemy immediately deals damage back to player
4. All other enemies in the room activate in order:
   - Each enemy moves toward player using Manhattan distance pathfinding (0-3 spaces)
   - Each enemy attacks player if now adjacent
5. Round ends; player's next activation begins

**Escape Mechanic:**
- Player can move away from combat (disengaging)
- Disengagement is successful if player moves away from enemies
- Disengaged enemies do not immediately attack; they pursue on their next activation using pathfinding
- Player can re-engage or continue moving

### 2.5 Treasure and Rewards

#### Search Action

When player executes "Search for Treasure" in a space with a treasure:

**Possible Outcomes:**

1. **Weapon Upgrade**: Increases Attack Power
   - Example: +1 Attack, +2 Attack

2. **Health Potion**: One-time consumable, instantly restores HP
   - Example: Restore 5 HP, Restore all HP

3. **Permanent Health Upgrade**: Increases Max HP permanently
   - Example: +3 Max HP (persists across rooms)

4. **Movement Upgrade**: Increases Movement Range
   - Example: +2 Movement Range (persists across rooms)

5. **Special Item**: Unique items with effects
   - Example: Invisibility Cloak (allows player to ignore enemies when leaving a room)

6. **Trap**: Damage taken, no reward (30% chance)
   - Example: "You opened the chest and it exploded! You take 3 damage."

#### Treasure Mechanics

- **Discovery**: Treasures are placed in rooms during random generation
- **Reuse**: Once a treasure is discovered/claimed, it is removed from the room (no respawn within same room)
- **Randomization**: Treasure type and location vary by room
- **Risk/Reward**: Searching is optional but incentivized; traps introduce risk (30% trap rate)

---

## 3. Quest Structure

### 3.1 Quest Definition

A quest is a sequence of rooms with a set of win conditions. Quests are defined as JSON objects.

**Quest Object Schema:**
```json
{
  "questId": "string (unique identifier)",
  "name": "string (display name)",
  "description": "string (narrative/context)",
  "currentRoomIndex": "number (0-indexed)",
  "rooms": [
    {
      "roomId": "string",
      "name": "string",
      "layout": { /* room layout data */ },
      "enemies": [ /* enemy definitions */ ],
      "treasures": [ /* treasure definitions */ ]
    }
  ],
  "winConditions": {
    "defeatBoss": { "enemyType": "string", "required": boolean },
    "reachRoom": { "roomId": "string", "required": boolean }
  }
}
```

### 3.2 Win Conditions

A quest ends successfully when all required win conditions are met. Possible win conditions:

1. **Defeat Boss**: Specific enemy type/instance must be defeated
2. **Reach Room**: Player must enter a specific final/boss room

**MVP Win Condition:** Reach final room + defeat boss enemy (Fire Dragon)

### 3.3 Loss Condition

Quest fails if player HP ≤ 0

---

## 4. Turn/Activation System

### 4.1 Turn Order

Each "round" consists of sequential actor activations:

1. **Player Activation**: Player chooses action (move, search, fight, exit)
2. **Enemy Activations** (in pre-determined order): Each alive enemy activates once
3. Repeat until round ends (e.g., all enemies dead, player dead, or player exits room)

### 4.2 Activation Order

- **Player**: Always activates first in a round
- **Enemies**: Fixed order, randomly assigned on room load
  - Order persists for the duration of the room
  - Dead enemies are skipped
  - Example activation sequence: Player → Goblin-1 → Ghost-2 → Orc-1 (if alive)

### 4.3 Action Constraints by Room State

| Condition | Move | Search | Fight | Exit |
|-----------|------|--------|-------|------|
| No enemies | ✓ | ✓ | ✗ | ✓ (if at door) |
| Enemies present | ✓ | ✗ | ✓ | ✗ |
| At door | ✓ | ✓ (if no enemies) | ✓ | ✓ (if no enemies) |

---

## 5. Game State Architecture

### 5.1 State Object

All game state is centralized in a single `gameState` object:

```javascript
gameState = {
  // Persistent player data
  player: {
    id: "hero",
    hp: number,
    maxHp: number,
    attack: number,
    position: { x: number, y: number },
    inventory: [ /* item objects */ ],
    stats: {
      movementRange: number
    }
  },

  // Ephemeral room state (resets per room)
  currentRoom: {
    id: "string",
    name: "string",
    layout: { width: 7, height: 7, walls: [], doors: [] },
    enemies: [ /* enemy objects */ ],
    treasures: [ /* treasure objects */ ],
    discovered: [ /* discovered treasure IDs */ ]
  },

  // Quest progress
  quest: {
    id: "string",
    name: "string",
    currentRoomIndex: number,
    rooms: [ /* room definitions */ ],
    winConditions: { /* condition objects */ }
  },

  // Turn management
  turn: {
    activationOrder: [ "actor-id", "actor-id", ... ],
    currentActorIndex: number,
    currentActor: "string (actor id)",
    actionsUsedThisTurn: [ "move", "search", ... ], // prevents action chaining
    round: number
  },

  // Game meta
  gameStatus: "playing" | "won" | "lost",
  message: "string (current message to player)"
}
```

### 5.2 State Immutability

- All state updates return a new `gameState` object (functional programming pattern)
- Original state is not mutated
- Enables undo/redo, replay, debugging

---

## 6. System Architecture

### 6.1 Core Modules

#### ActionValidator
Determines if an action is legal given current game state.

```
canMove(gameState) → boolean
canSearch(gameState) → boolean
canFight(gameState, enemy) → boolean
canExit(gameState) → boolean
```

#### ActionExecutor
Applies action to game state and returns updated state.

```
executeMove(gameState, dx, dy) → gameState
executeSearch(gameState) → { gameState, result }
executeFight(gameState, enemy) → { gameState, damageDealt, enemySurvived }
executeExit(gameState) → { gameState, nextRoom? }
```

#### TurnResolver
Orchestrates turn-by-turn resolution.

```
resolveActivation(gameState, action) → gameState
resolveEnemyActivations(gameState) → gameState
```

#### RoomGenerator
Generates random rooms for Phase 1.

```
generateRoom(roomDef, playerStats) → roomState
placeEnemies(roomLayout, enemyDefinitions) → enemies
placeTreasures(roomLayout) → treasures
```

#### Renderer
Handles all visual presentation.

```
drawRoom(gameState) → null
drawUI(gameState) → null
drawMessage(message) → null
handleInput(input) → { action, target }
```

---

## 7. Visual Design

### 7.1 Aesthetic

- **Style**: Minimalist, retro arcade (inspired by classic Zelda, Gameboy Pokemon)
- **Rendering**: 2D top-down view with scroll-to-follow camera
- **Assets**: Simple geometric shapes and emojis; minimal animation
- **Performance**: Optimized for lightweight browsers and mobile

### 7.2 Camera System

- **Type**: Scroll-to-follow (Gameboy Pokemon style)
- **Player Position**: Player character scrolls to stay in visible viewport as they move
- **Grid**: 7x7 spaces, each rendered at 50px
- **Viewport**: 350x350px window into the grid
- **Smooth Scrolling**: Camera transitions smoothly to follow player movement

### 7.3 Layout

**Game Canvas:**
- 7x7 grid (each cell represents one game space)
- Top-down orthogonal perspective
- 50px per cell for clarity on mobile

**UI Elements:**
- Player stats panel (HP, Attack, Movement Range, Position)
- Current room info
- Message log (current action/result)
- Action buttons (Move, Search, Fight, Exit)
- Keyboard support (Arrow keys / WASD for movement)

### 7.4 Visual Differentiation

- **Player**: Blue circle with outline (🧙 wizard emoji)
- **Enemies**: Different emoji per type
  - Goblin: 👹 (red border, red tint)
  - Ghost: 👻 (red border, red tint)
  - Orc: 🐷 (red border, red tint)
  - Fire Dragon: 🐉 (red border, red tint, boss enemy)
- **Walls**: Dark gray squares
- **Doors**: Gold/yellow outline
- **Treasures**: ✨ yellow star emoji
- **Occupied Spaces**: Character renders above terrain

### 7.5 Animations

**MVP:**
- Instant movement (no interpolation)
- Smooth camera scroll (0.1s ease-out)
- Instant damage numbers
- Turn-by-turn enemy updates

**Future Enhancements:**
- Smooth movement interpolation
- Attack animations (swing, impact)
- Damage feedback (flash, shake)

---

## 8. Input/Interaction

### 8.1 Input Methods

**MVP Implementation:**
- **Point-and-Click**: Click directional buttons to move, click enemy to fight, buttons for search/exit
- **Keyboard**: Arrow keys or WASD to move, buttons for actions, Enter to confirm

**Both input methods are fully supported and functional.**

### 8.2 Action Buttons

- **Movement Buttons (Up/Down/Left/Right)**: Directional movement up to 6 squares
- **Search Button**: Triggers search if legal (no enemies in room)
- **Fight Button**: Fights nearest adjacent enemy if available
- **Exit Button**: Exits room if at doorway and no enemies present

### 8.3 Keyboard Controls

- **Arrow Keys or WASD**: Move in cardinal directions (one square per press)
- **Buttons**: All actions accessible via on-screen buttons

---

## 9. Data Persistence (Scope by Phase)

### 9.1 Phase 1 (MVP)

- **Session**: All game state held in memory during playthrough
- **Quest Completion**: On winning/losing quest, game displays final state
- **No resume**: If player closes browser, progress is lost
- **Justification**: Fits 20-30 minute session model; no persistence infrastructure needed for MVP

### 9.2 Phase 2 (Extended)

- **Between-Quest Persistence**: Use browser `localStorage` to save player stats, completed quests, unlocked items
- **Save/Load Quest**: Allow player to resume mid-quest
- **Backend (optional)**: Cloud save with user accounts
- **Data Export**: Allow player to export/import save file as JSON

---

## 10. Room and Enemy Definitions

### 10.1 Room Definition Schema

```json
{
  "roomId": "string",
  "name": "string",
  "layout": {
    "width": 7,
    "height": 7,
    "walls": [ { "x": 1, "y": 2 }, ... ]
  },
  "enemySpawns": [
    {
      "type": "goblin",
      "count": 2,
      "stats": { "hp": 3, "attack": 1, "movementRange": 2 }
    }
  ],
  "treasures": [
    {
      "treasureId": "chest-1",
      "position": { "x": 5, "y": 5 },
      "type": "weapon",
      "reward": { "attack": 1 }
    }
  ]
}
```

### 10.2 Enemy Types

**MVP Enemy Types:**

1. **Goblin**: Weak, fast
   - HP: 3, Attack: 1, Movement: 2
   - Color/Emoji: 👹 red
   
2. **Ghost**: Medium, evasive
   - HP: 2, Attack: 2, Movement: 3
   - Color/Emoji: 👻 red

3. **Orc**: Strong, slow
   - HP: 5, Attack: 2, Movement: 1
   - Color/Emoji: 🐷 red

4. **Fire Dragon** (Boss): Very strong
   - HP: 8, Attack: 3, Movement: 2
   - Color/Emoji: 🐉 red (appears in final room)

**Phase 2 Additions:**
- Additional enemy types
- Minion variants
- Custom enemy editor in map editor

### 10.3 Treasure Types

- Weapon upgrades (+1 to +2 Attack)
- Health potions (restore 5 HP or full HP)
- Max HP upgrades (+3 to +5 Max HP, permanent)
- Movement upgrades (+2 Movement Range, permanent)
- Special items (future: Invisibility Cloak, etc.)
- Traps (damage 1-3 HP, no reward, 30% chance when searching)

### 10.4 Enemy AI - Pathfinding

**Algorithm:** Manhattan Distance Pathfinding
- Enemies move toward player's current position
- Takes shortest valid path, avoiding walls and occupied spaces
- If blocked by walls/enemies, tries alternative directions
- Recalculates path each turn
- **Performance:** O(1) per enemy per turn, no expensive algorithms

---

## 11. MVP Scope (Phase 1)

### 11.1 Deliverables

1. **Core Game Loop**: Full turn-based combat and movement
2. **One Quest**: 4 randomized rooms leading to Fire Dragon boss
3. **Enemy AI**: Manhattan distance pathfinding pursuit behavior
4. **Treasure System**: Search mechanic with 70% reward / 30% trap rates
5. **Win/Loss States**: Quest completion and game over
6. **UI**: Stats panel, action buttons, message log
7. **Renderer**: Top-down 7x7 grid with player-centered, scroll-to-follow camera
8. **Input**: Point-and-click + keyboard (Arrow/WASD) support
9. **Visual Differentiation**: Emojis and colors for all game elements

### 11.2 Out of Scope (Phase 1)

- Persistent progression between quests
- Map editor
- Predetermined dungeons
- Narrative/story elements
- Save/resume mid-quest
- Advanced enemy AI (advanced pathfinding, tactics)
- Particle effects or advanced animations
- Sound/music
- Difficulty settings
- Multiple quests or campaigns

---

## 12. Phase 2 Scope (Extended, Post-MVP)

### 12.1 Major Features

1. **Persistent Progression**: Save player stats across quests using localStorage
2. **Map Editor**: Visual tool to design dungeons, place enemies, define treasures
3. **Multiple Quests**: Campaign mode with story progression
4. **Narrative Elements**: Dialogue, quest briefings, story arcs
5. **Advanced Upgrades**: Skill tree, special abilities, unique weapons
6. **Leaderboards**: Track quest completion times, highest scores
7. **Achievements**: Unlock badges for completing challenges
8. **Predetermined Dungeons**: Hand-crafted dungeons alongside random generation

### 12.2 Technical Enhancements

- Backend API for cloud saves
- User accounts and authentication
- Procedural dungeon generation (advanced algorithms)
- Advanced enemy AI (A*, tactical positioning)
- Smooth animations and visual effects
- Sound design and music

---

## 13. Technical Constraints and Considerations

### 13.1 Browser Compatibility

- Target: Modern browsers (Chrome, Firefox, Safari, Edge)
- Minimum: ES6 JavaScript support
- No external dependencies (React used for MVP artifact only)
- Mobile-first responsive design

### 13.2 Performance

- Render target: 60 FPS on average mobile device
- State updates: <16ms per turn
- Memory footprint: <5MB for full quest
- No asset loading delays (all assets generated via code/emojis)

### 13.3 Accessibility

- Keyboard navigation support (Arrow keys / WASD)
- Point-and-click support for all actions
- Clear visual contrast (colored emojis, dark background)
- Screen reader compatibility (future enhancement)

---

## 14. Success Metrics (Phase 1)

- Core gameplay loop is playable from start to finish
- Combat feels tactical and engaging with smart enemy pathfinding
- No major bugs or game-breaking issues
- Playable on mobile browsers with smooth scrolling
- Single quest completable in 20-30 minutes
- Player feels sense of progression/reward from treasure and upgrades

---

## 15. Appendix: Example Quest (MVP)

**Quest ID:** dragon-hoard

**Quest Name:** The Dragon's Hoard

**Rooms:**
1. Entrance Hall (2 Goblins, 2 treasures)
2. Corridor (2 Ghosts, 2 treasures)
3. Treasury (1 Goblin + 1 Orc, 2 treasures)
4. Boss Chamber (Fire Dragon boss, treasure)

**Win Condition:** Reach Boss Chamber + Defeat Fire Dragon

**Loss Condition:** Player HP ≤ 0 at any point

**Enemy Distribution by Room:**
- Room 1: 2 Goblins
- Room 2: 2 Ghosts
- Room 3: 1 Goblin + 1 Orc
- Room 4: 1 Fire Dragon (boss)

---

## 16. Design Decisions Made

### 16.1 Camera System
**Decision:** Scroll-to-follow (Gameboy Pokemon style) rather than player-centered

**Rationale:** 
- Provides a more dynamic, immersive experience
- Allows player to see more of the world as they move
- Scales well for larger dungeons in Phase 2
- Smooth scrolling feels more modern/polished

### 16.2 Enemy AI
**Decision:** Manhattan distance pathfinding rather than advanced A* algorithm

**Rationale:**
- Fast and performant (O(1) per enemy per turn)
- Provides intelligent, predictable enemy behavior
- Enemies feel like they're hunting the player
- Easy to expand with tactical variants in Phase 2

### 16.3 Combat Disengagement
**Decision:** Allow player to escape by moving away from enemies

**Rationale:**
- Adds tactical depth and player agency
- Prevents combat from being "locked" until death
- Encourages strategic positioning and retreat
- Makes movement a meaningful tactical choice

### 16.4 Input Methods
**Decision:** Support both keyboard and point-and-click simultaneously

**Rationale:**
- Maximizes accessibility and device compatibility
- Allows player choice based on input device (touch vs. keyboard)
- Mobile-friendly with button support
- Desktop-friendly with keyboard support

### 16.5 Treasure Risk/Reward
**Decision:** 30% trap rate, 70% reward rate with random reward types

**Rationale:**
- Creates meaningful risk/reward decisions
- 30% trap rate makes searching tactical (optional, not always safe)
- Random rewards encourage exploration
- Traps provide damage feedback and challenge

---

**Document Version:** 2.0  
**Last Updated:** January 2026  
**Status:** MVP In Development