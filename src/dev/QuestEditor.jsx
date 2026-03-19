import React, { useState, useMemo } from 'react';
import { Download, Upload, Plus, Trash2, Save, X, Edit3, AlertCircle, CheckCircle2 } from 'lucide-react';
import ENEMY_TYPES from '../data/enemies.js';

const GRID_SIZE = 7;
const CELL_SIZE = 50;

const TOOL_TYPES = {
  SELECT: 'select',
  WALL: 'wall',
  DOOR: 'door',
  PLATE: 'plate',
  SWITCH: 'switch',
  TREASURE: 'treasure',
  STORY_ITEM: 'story_item',
  NPC: 'npc',
  ENEMY: 'enemy',
  START_POSITION: 'start_position',
  CLEAR: 'clear'
};

const TREASURE_TYPES = [
  { id: 'random', name: 'Random (Loot Table)', type: 'random', reward: {}, description: 'Uses the weighted loot table (Potions, Gold, Upgrades) to determine reward.' },
  { id: 'weapon-1', name: '+1 Attack', type: 'weapon', reward: { attack: 1 }, description: 'Increases player attack power by 1.' },
  { id: 'weapon-2', name: '+2 Attack', type: 'weapon', reward: { attack: 2 }, description: 'Increases player attack power by 2.' },
  { id: 'health-5', name: 'Restore 5 HP', type: 'potion', reward: { hp: 5 }, description: 'Restores 5 hit points to the player.' },
  { id: 'health-max', name: 'Restore Max HP', type: 'potion', reward: { hpFull: true }, description: 'Fully restores the player\'s health.' },
  { id: 'maxhp-3', name: '+3 Max HP', type: 'maxhp', reward: { maxHp: 3 }, description: 'Permanently increases Max HP by 3.' },
  { id: 'maxhp-5', name: '+5 Max HP', type: 'maxhp', reward: { maxHp: 5 }, description: 'Permanently increases Max HP by 5.' },
  { id: 'energy-1', name: 'Energy Upgrade', type: 'energy_upgrade', reward: { apTotal: 1 }, description: 'Permanently increases maximum Action Points by 1.' },
  { id: 'trap', name: 'Trap (Damage 3)', type: 'trap', reward: { damage: 3 }, description: 'Deals 3 damage to the player when found.' }
];

export default function QuestEditor() {
  const [rooms, setRooms] = useState([createEmptyRoom('room-1', 'Room 1')]);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [startPosition, setStartPosition] = useState({ x: 3, y: 0 });
  const [activeTool, setActiveTool] = useState(TOOL_TYPES.WALL);
  const [selectedEnemy, setSelectedEnemy] = useState('goblin');
  const [selectedTreasure, setSelectedTreasure] = useState('weapon-1');
  const [questName, setQuestName] = useState('New Quest');
  const [questId, setQuestId] = useState('new-quest');
  const [questDescription, setQuestDescription] = useState('A dangerous challenge awaits you in the depths of the dungeon.');
  const [victoryMessage, setVictoryMessage] = useState('You have completed the quest!');
  const [turnLimit, setTurnLimit] = useState(0);
  const [winConditions, setWinConditions] = useState({
    defeatBoss: { required: false, enemyType: 'dragon' },
    collectItem: { required: false, itemId: '' },
    monsterQuota: { required: false, count: 5 },
    exfiltrate: { required: true }
  });
  const [editingDoor, setEditingDoor] = useState(null); // {x, y}
  const [editingPuzzle, setEditingPuzzle] = useState(null); // {x, y}
  const [editingStoryItem, setEditingStoryItem] = useState(null); // {x, y}
  const [editingNPC, setEditingNPC] = useState(null); // {x, y}

  const currentRoom = rooms[currentRoomIndex];

  // --- Validation Logic ---
  const validation = useMemo(() => {
    const errors = [];
    const warnings = [];
    const collisionMap = {};
    const reachableRooms = new Set();

    // 1. Check Collisions & Initialize reachable search
    rooms.forEach(r => {
      const key = `${r.coords.x},${r.coords.y}`;
      if (!collisionMap[key]) collisionMap[key] = [];
      collisionMap[key].push(r.roomId);
    });

    Object.entries(collisionMap).forEach(([coords, ids]) => {
      if (ids.length > 1) {
        errors.push({ type: 'collision', message: `Multiple rooms at (${coords}): ${ids.join(', ')}`, ids });
      }
    });

    // 2. Check Reachability (BFS)
    if (rooms.length > 0) {
      const queue = [rooms[0].roomId];
      reachableRooms.add(rooms[0].roomId);
      
      while (queue.length > 0) {
        const currentId = queue.shift();
        const r = rooms.find(room => room.roomId === currentId);
        if (!r) continue;

        r.doors.forEach(door => {
          // Absolute navigation check
          const { x, y } = r.coords;
          let targetCoords = { x, y };
          if (door.position.y === 0) targetCoords.y -= 1;
          else if (door.position.y === 6) targetCoords.y += 1;
          else if (door.position.x === 0) targetCoords.x -= 1;
          else if (door.position.x === 6) targetCoords.x += 1;

          const neighbor = rooms.find(nb => nb.coords.x === targetCoords.x && nb.coords.y === targetCoords.y);
          if (neighbor && !reachableRooms.has(neighbor.roomId)) {
            reachableRooms.add(neighbor.roomId);
            queue.push(neighbor.roomId);
          }
        });
      }
    }

    rooms.forEach(r => {
      if (!reachableRooms.has(r.roomId)) {
        warnings.push({ type: 'isolated', message: `Room "${r.name}" is isolated from the start.`, id: r.roomId });
      }

      // 3. Check Dead-end Doors
      r.doors.forEach(door => {
        // Skip check if this is intentionally an exit door
        if (door.isExit) return;

        const { x, y } = r.coords;
        let targetCoords = { x, y };
        if (door.position.y === 0) targetCoords.y -= 1;
        else if (door.position.y === 6) targetCoords.y += 1;
        else if (door.position.x === 0) targetCoords.x -= 1;
        else if (door.position.x === 6) targetCoords.x += 1;

        const neighbor = rooms.find(nb => nb.coords.x === targetCoords.x && nb.coords.y === targetCoords.y);
        if (!neighbor && door.leadsTo) {
          warnings.push({ type: 'deadend', message: `Door in "${r.name}" at (${door.position.x},${door.position.y}) leads to empty space (${targetCoords.x},${targetCoords.y}).`, id: r.roomId });
        }
      });
    });

    // 4. Validate Exfiltration Config
    if (winConditions.exfiltrate.required) {
        const hasExitDoor = rooms.some(r => r.doors.some(d => d.isExit));
        if (!hasExitDoor) {
            errors.push({ type: 'missing-exit', message: "Quest requires exfiltration, but no door is marked as an 'Exit'." });
        }
    }

    return { errors, warnings, reachableRooms };
  }, [rooms, winConditions.exfiltrate.required]);

  // --- Difficulty Evaluation Logic ---
  const evaluation = useMemo(() => {
    if (turnLimit <= 0) return null;

    // 1. Estimate Travel Turns
    // We'll use BFS to find the longest path from start (index 0)
    let maxPathLength = 0;
    const distances = { [rooms[0].roomId]: 0 };
    const queue = [rooms[0].roomId];
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      const r = rooms.find(room => room.roomId === currentId);
      if (!r) continue;

      r.doors.forEach(door => {
        const { x, y } = r.coords;
        let targetCoords = { x, y };
        if (door.position.y === 0) targetCoords.y -= 1;
        else if (door.position.y === 6) targetCoords.y += 1;
        else if (door.position.x === 0) targetCoords.x -= 1;
        else if (door.position.x === 6) targetCoords.x += 1;

        const neighbor = rooms.find(nb => nb.coords.x === targetCoords.x && nb.coords.y === targetCoords.y);
        if (neighbor && distances[neighbor.roomId] === undefined) {
          distances[neighbor.roomId] = distances[currentId] + 1;
          maxPathLength = Math.max(maxPathLength, distances[neighbor.roomId]);
          queue.push(neighbor.roomId);
        }
      });
    }

    const travelMultiplier = winConditions.exfiltrate.required ? 2 : 1;
    const avgSquaresPerRoom = 5; // Average moves to cross a room
    const travelTurns = Math.ceil((maxPathLength * avgSquaresPerRoom * travelMultiplier) / 6);

    // 2. Estimate Combat Turns
    // 6 AP per turn, Fight costs 2 AP. Assume average 2 attacks to kill an enemy.
    let totalEnemyHP = 0;
    rooms.forEach(r => r.enemies.forEach(e => totalEnemyHP += e.hp));
    const combatTurns = Math.ceil((totalEnemyHP / 2) * (2 / 6)); // Rough estimate

    // 3. Estimate Search Turns
    // Search costs 2 AP.
    let totalTreasures = 0;
    rooms.forEach(r => totalTreasures += r.treasures.length);
    const searchTurns = Math.ceil((totalTreasures * 2) / 6);

    const expectedTurns = travelTurns + combatTurns + searchTurns;
    const ratio = turnLimit / expectedTurns;

    let grade = 'S';
    let color = 'text-blue-400';
    let label = 'Very Easy';

    if (ratio < 0.8) { grade = 'F'; color = 'text-red-500'; label = 'Impossible'; }
    else if (ratio < 1.0) { grade = 'D'; color = 'text-red-400'; label = 'Cruel'; }
    else if (ratio < 1.2) { grade = 'C'; color = 'text-orange-400'; label = 'Hard'; }
    else if (ratio < 1.5) { grade = 'B'; color = 'text-green-400'; label = 'Balanced'; }
    else if (ratio < 2.0) { grade = 'A'; color = 'text-blue-400'; label = 'Generous'; }

    return { travelTurns, combatTurns, searchTurns, expectedTurns, grade, color, label, ratio };
  }, [rooms, turnLimit, winConditions.exfiltrate.required]);

  function createEmptyRoom(id, name) {
    return {
      roomId: id,
      name,
      coords: { x: 0, y: 0 },
      flavorText: '',
      layout: { width: GRID_SIZE, height: GRID_SIZE, walls: [] },
      enemies: [],
      treasures: [],
      npcs: [],
      puzzleObjects: [],
      doors: [],
      discovered: []
    };
  }

  function toggleWall(x, y) {
    const newRooms = [...rooms];
    const walls = newRooms[currentRoomIndex].layout.walls;
    const wallIndex = walls.findIndex(w => w.x === x && w.y === y);
    
    if (wallIndex > -1) {
      walls.splice(wallIndex, 1);
    } else {
      walls.push({ x, y });
    }
    
    setRooms(newRooms);
  }

  function toggleTreasure(x, y) {
    const newRooms = [...rooms];
    const treasures = newRooms[currentRoomIndex].treasures;
    const treasureIndex = treasures.findIndex(t => t.position.x === x && t.position.y === y);
    
    if (treasureIndex > -1) {
      treasures.splice(treasureIndex, 1);
    } else {
      const treasure = TREASURE_TYPES.find(t => t.id === selectedTreasure);
      treasures.push({
        id: `${treasure.id}-${Date.now()}`,
        name: treasure.name,
        type: treasure.type,
        position: { x, y }
      });
    }
    
    setRooms(newRooms);
  }

  function toggleEnemy(x, y) {
    const newRooms = [...rooms];
    const enemies = newRooms[currentRoomIndex].enemies;
    const enemyIndex = enemies.findIndex(e => e.position.x === x && e.position.y === y);
    
    if (enemyIndex > -1) {
      enemies.splice(enemyIndex, 1);
    } else {
      const enemyType = ENEMY_TYPES[selectedEnemy];
      enemies.push({
        id: `${selectedEnemy}-${Date.now()}`,
        type: selectedEnemy,
        position: { x, y },
        hp: enemyType.hp,
        maxHp: enemyType.hp,
        attack: enemyType.attack,
        movementRange: enemyType.movementRange
      });
    }
    
    setRooms(newRooms);
  }

  function togglePuzzleObject(x, y, type) {
    const newRooms = [...rooms];
    const objects = newRooms[currentRoomIndex].puzzleObjects;
    const objIndex = objects.findIndex(p => p.position.x === x && p.position.y === y);
    
    if (objIndex > -1) {
      setEditingPuzzle(objects[objIndex].position);
    } else {
      const newObj = {
        id: `${type}-${Date.now()}`,
        type: type,
        position: { x, y },
        triggers: []
      };
      objects.push(newObj);
      setRooms(newRooms);
      setEditingPuzzle(newObj.position);
    }
  }

  function handleGridClick(x, y) {
    const isDoorCell = (x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1);
    const isWall = currentRoom.layout.walls.find(w => w.x === x && w.y === y);

    // --- PRIORITY: Edit Existing Objects ---
    // If user is NOT using CLEAR, clicking an existing interactive object should edit it
    if (activeTool !== TOOL_TYPES.CLEAR) {
        const existingDoor = currentRoom.doors.find(d => d.position.x === x && d.position.y === y);
        if (existingDoor) { setEditingDoor({ x, y }); return; }

        const existingPuzzle = currentRoom.puzzleObjects.find(p => p.position.x === x && p.position.y === y);
        if (existingPuzzle) { setEditingPuzzle({ x, y }); return; }

        const existingStoryItem = currentRoom.treasures.find(t => t.position.x === x && t.position.y === y && t.type === 'story-item');
        if (existingStoryItem) { setEditingStoryItem({ x, y }); return; }

        const existingNPC = currentRoom.npcs?.find(n => n.position.x === x && n.position.y === y);
        if (existingNPC) { setEditingNPC({ x, y }); return; }
    }

    // --- TOOL ACTIONS ---
    if (activeTool === TOOL_TYPES.DOOR) {
      if (isDoorCell && !isWall) {
        setEditingDoor({ x, y });
      } else {
        alert('Doors can only be placed on empty edge tiles.');
      }
      return;
    }

    if (isDoorCell && (activeTool === TOOL_TYPES.ENEMY || activeTool === TOOL_TYPES.TREASURE || activeTool === TOOL_TYPES.PLATE || activeTool === TOOL_TYPES.SWITCH || activeTool === TOOL_TYPES.NPC)) {
        alert('Cannot place interactive objects on door tiles. Use the DOOR tool.');
        return;
    }

    if (activeTool === TOOL_TYPES.WALL) {
      toggleWall(x, y);
    } else if (activeTool === TOOL_TYPES.TREASURE) {
      toggleTreasure(x, y);
    } else if (activeTool === TOOL_TYPES.STORY_ITEM) {
      const newItem = {
        id: `story-item-${Date.now()}`,
        name: 'Mysterious Note',
        type: 'story-item',
        position: { x, y },
        message: 'You found a scrap of paper with ancient writing.'
      };
      const newRooms = [...rooms];
      newRooms[currentRoomIndex].treasures.push(newItem);
      setRooms(newRooms);
      setEditingStoryItem(newItem.position);
    } else if (activeTool === TOOL_TYPES.NPC) {
      const newNPC = {
        id: `npc-${Date.now()}`,
        name: 'Lost Explorer',
        emoji: '🧙',
        position: { x, y },
        dialogue: 'Safe travels, adventurer!'
      };
      const newRooms = [...rooms];
      if (!newRooms[currentRoomIndex].npcs) newRooms[currentRoomIndex].npcs = [];
      newRooms[currentRoomIndex].npcs.push(newNPC);
      setRooms(newRooms);
      setEditingNPC(newNPC.position);
    } else if (activeTool === TOOL_TYPES.ENEMY) {
      toggleEnemy(x, y);
    } else if (activeTool === TOOL_TYPES.PLATE) {
      togglePuzzleObject(x, y, 'plate');
    } else if (activeTool === TOOL_TYPES.SWITCH) {
      togglePuzzleObject(x, y, 'switch');
    } else if (activeTool === TOOL_TYPES.START_POSITION) {
      if (currentRoomIndex !== 0) {
        alert('Starting position can only be set in the first room (Room 1).');
        return;
      }
      if (isWall) {
        alert('Cannot place start position on a wall.');
        return;
      }
      setStartPosition({ x, y });
    } else if (activeTool === TOOL_TYPES.CLEAR) {
      const newRooms = [...rooms];
      const r = newRooms[currentRoomIndex];
      
      r.layout.walls = r.layout.walls.filter(w => !(w.x === x && w.y === y));
      r.treasures = r.treasures.filter(t => !(t.position.x === x && t.position.y === y));
      r.enemies = r.enemies.filter(e => !(e.position.x === x && e.position.y === y));
      r.puzzleObjects = r.puzzleObjects.filter(p => !(p.position.x === x && p.position.y === y));
      r.doors = r.doors.filter(d => !(d.position.x === x && d.position.y === y));
      if (r.npcs) r.npcs = r.npcs.filter(n => !(n.position.x === x && n.position.y === y));
      
      setRooms(newRooms);
    }
  }

  function addRoom() {
    const newRoomId = `room-${rooms.length + 1}`;
    const newRooms = [...rooms, createEmptyRoom(newRoomId, `Room ${rooms.length + 1}`)];
    setRooms(newRooms);
    setCurrentRoomIndex(newRooms.length - 1);
  }

  function deleteRoom() {
    if (rooms.length === 1) return;
    const deletedRoomId = rooms[currentRoomIndex].roomId;
    const newRooms = rooms
      .filter((_, i) => i !== currentRoomIndex)
      .map(room => ({
        ...room,
        doors: room.doors.filter(door => door.leadsTo !== deletedRoomId)
      }));
    setRooms(newRooms);
    setCurrentRoomIndex(Math.max(0, currentRoomIndex - 1));
  }

  function updateRoomProp(prop, value) {
    const newRooms = [...rooms];
    if (prop === 'x' || prop === 'y') {
      newRooms[currentRoomIndex].coords[prop] = parseInt(value) || 0;
    } else {
      newRooms[currentRoomIndex][prop] = value;
    }
    setRooms(newRooms);
  }

  function handleDoorSave(doorData) {
    const newRooms = [...rooms];
    const currentRoom = newRooms[currentRoomIndex];
    const currentDoors = currentRoom.doors;
    const doorIndex = currentDoors.findIndex(d => d.position.x === editingDoor.x && d.position.y === editingDoor.y);

    const doorObj = {
      id: doorData.id,
      position: editingDoor,
      leadsTo: doorData.leadsTo,
      isLocked: doorData.isLocked,
      isExit: doorData.isExit,
      isFake: doorData.isFake,
      trapDamage: doorData.trapDamage,
      customMessage: doorData.customMessage,
      requires: doorData.requires || []
    };

    if (doorIndex > -1) {
      currentDoors[doorIndex] = doorObj;
    } else {
      currentDoors.push(doorObj);
    }

    // --- SPATIAL INTELLIGENCE: Auto-Link Return Door ---
    if (doorData.leadsTo && !doorData.isExit) {
      const targetRoom = newRooms.find(r => r.roomId === doorData.leadsTo);
      if (targetRoom) {
        const returnPos = { x: editingDoor.x, y: editingDoor.y };
        if (editingDoor.y === 0) returnPos.y = 6;
        else if (editingDoor.y === 6) returnPos.y = 0;
        else if (editingDoor.x === 0) returnPos.x = 6;
        else if (editingDoor.x === 6) returnPos.x = 0;

        const existingReturn = targetRoom.doors.find(d => d.position.x === returnPos.x && d.position.y === returnPos.y);
        if (!existingReturn) {
          targetRoom.doors.push({
            id: `door-return-${Date.now()}`,
            position: returnPos,
            leadsTo: currentRoom.roomId,
            isLocked: false,
            requires: []
          });
        }
      }
    }

    setRooms(newRooms);
    setEditingDoor(null);
  }

  function handlePuzzleSave(triggers) {
    const newRooms = [...rooms];
    const obj = newRooms[currentRoomIndex].puzzleObjects.find(p => p.position.x === editingPuzzle.x && p.position.y === editingPuzzle.y);
    if (obj) {
      obj.triggers = triggers.split(',').map(t => t.trim()).filter(t => t);
    }
    setRooms(newRooms);
    setEditingPuzzle(null);
  }

  function handleStoryItemSave(data) {
    const newRooms = [...rooms];
    const item = newRooms[currentRoomIndex].treasures.find(t => t.position.x === editingStoryItem.x && t.position.y === editingStoryItem.y);
    if (item) {
      item.name = data.name;
      item.id = data.id;
      item.message = data.message;
    }
    setRooms(newRooms);
    setEditingStoryItem(null);
  }

  function handleNPCSave(data) {
    const newRooms = [...rooms];
    const npc = newRooms[currentRoomIndex].npcs.find(n => n.position.x === editingNPC.x && n.position.y === editingNPC.y);
    if (npc) {
      npc.name = data.name;
      npc.emoji = data.emoji;
      // Convert multi-line string to array of strings for the game engine
      npc.dialogue = data.dialogue.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    }
    setRooms(newRooms);
    setEditingNPC(null);
  }

  function exportQuest() {
    const quest = {
      questId,
      name: questName,
      description: questDescription,
      victoryMessage,
      turnLimit: turnLimit > 0 ? turnLimit : null,
      playerStart: startPosition,
      rooms: rooms.map(r => ({
        roomId: r.roomId,
        name: r.name,
        coords: r.coords,
        flavorText: r.flavorText,
        walls: r.layout.walls,
        doors: r.doors,
        enemies: r.enemies,
        treasures: r.treasures,
        npcs: r.npcs || [],
        puzzleObjects: r.puzzleObjects
      })),
      winConditions: {
        ...winConditions,
        reachRoom: { roomId: rooms[rooms.length - 1].roomId, required: false }
      }
    };
    
    const dataStr = JSON.stringify(quest, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${questId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importQuest(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const quest = JSON.parse(e.target.result);
        setQuestId(quest.questId);
        setQuestName(quest.name);
        setQuestDescription(quest.description || `Quest: ${quest.name}`);
        setVictoryMessage(quest.victoryMessage || 'You have completed the quest!');
        setTurnLimit(quest.turnLimit || 0);
        
        if (quest.winConditions) {
            setWinConditions({
                defeatBoss: quest.winConditions.defeatBoss || { required: false, enemyType: 'dragon' },
                collectItem: quest.winConditions.collectItem || { required: false, itemId: '' },
                monsterQuota: quest.winConditions.monsterQuota || { required: false, count: 5 },
                exfiltrate: quest.winConditions.exfiltrate || { required: true }
            });
        }

        setRooms(quest.rooms.map(r => ({
          ...createEmptyRoom(r.roomId, r.name),
          ...r,
          layout: { ...createEmptyRoom().layout, walls: r.walls || [] }
        })));
        if (quest.playerStart) setStartPosition(quest.playerStart);
        setCurrentRoomIndex(0);
      } catch (err) { alert('Failed to parse JSON'); }
    };
    reader.readAsText(file);
  }

  function getCellContent(x, y) {
    if (currentRoomIndex === 0 && startPosition.x === x && startPosition.y === y) return '🧙';
    if (currentRoom.layout.walls.find(w => w.x === x && w.y === y)) return '█';
    const door = currentRoom.doors.find(d => d.position.x === x && d.position.y === y);
    if (door) {
        if (door.isLocked) return '🔒';
        if (door.isExit) return '🏁';
        return '🚪';
    }
    const pObj = currentRoom.puzzleObjects.find(p => p.position.x === x && p.position.y === y);
    if (pObj) return pObj.type === 'plate' ? '🟩' : '⚙️';
    const treasure = currentRoom.treasures.find(t => t.position.x === x && t.position.y === y);
    if (treasure) {
      if (treasure.type === 'story-item') return '📜';
      return '✨';
    }
    const npc = currentRoom.npcs?.find(n => n.position.x === x && n.position.y === y);
    if (npc) return npc.emoji || '👤';
    const enemy = currentRoom.enemies.find(e => e.position.x === x && e.position.y === y);
    if (enemy) return ENEMY_TYPES[enemy.type].emoji;
    return '';
  }

  const selectedEnemyData = ENEMY_TYPES[selectedEnemy];
  const selectedTreasureData = TREASURE_TYPES.find(t => t.id === selectedTreasure);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      {editingDoor && (
        <DoorModal 
          door={currentRoom.doors.find(d => d.position.x === editingDoor.x && d.position.y === editingDoor.y) || editingDoor} 
          rooms={rooms} 
          currentRoom={currentRoom}
          onSave={handleDoorSave} 
          onClose={() => setEditingDoor(null)} 
        />
      )}
      {editingStoryItem && (
        <StoryItemModal 
          item={currentRoom.treasures.find(t => t.position.x === editingStoryItem.x && t.position.y === editingStoryItem.y)}
          onSave={handleStoryItemSave}
          onClose={() => setEditingStoryItem(null)}
          onDelete={() => {
            const newRooms = [...rooms];
            newRooms[currentRoomIndex].treasures = newRooms[currentRoomIndex].treasures.filter(t => !(t.position.x === editingStoryItem.x && t.position.y === editingStoryItem.y));
            setRooms(newRooms);
            setEditingStoryItem(null);
          }}
        />
      )}
      {editingNPC && (
        <NPCModal 
          npc={currentRoom.npcs.find(n => n.position.x === editingNPC.x && n.position.y === editingNPC.y)}
          onSave={handleNPCSave}
          onClose={() => setEditingNPC(null)}
          onDelete={() => {
            const newRooms = [...rooms];
            newRooms[currentRoomIndex].npcs = newRooms[currentRoomIndex].npcs.filter(n => !(n.position.x === editingNPC.x && n.position.y === editingNPC.y));
            setRooms(newRooms);
            setEditingNPC(null);
          }}
        />
      )}
      {editingPuzzle && (
        <PuzzleModal 
          obj={currentRoom.puzzleObjects.find(p => p.position.x === editingPuzzle.x && p.position.y === editingPuzzle.y)} 
          onSave={handlePuzzleSave} 
          onClose={() => setEditingPuzzle(null)} 
          onDelete={() => {
            const newRooms = [...rooms];
            newRooms[currentRoomIndex].puzzleObjects = newRooms[currentRoomIndex].puzzleObjects.filter(p => !(p.position.x === editingPuzzle.x && p.position.y === editingPuzzle.y));
            setRooms(newRooms);
            setEditingPuzzle(null);
          }} 
        />
      )}
      
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-orange-400 tracking-tight">HeroQuest Builder</h1>
          <div className="flex gap-3">
            <button onClick={exportQuest} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold transition shadow-lg"><Download size={20} /> Export</button>
            <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold cursor-pointer transition shadow-lg"><Upload size={20} /> Import<input type="file" accept=".json" onChange={importQuest} className="hidden" /></label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {/* Quest Info & Settings */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Quest ID</label>
                  <input type="text" value={questId} onChange={(e) => setQuestId(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-orange-100" />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Quest Name</label>
                  <input type="text" value={questName} onChange={(e) => setQuestName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-orange-100" />
                </div>
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Victory Message</label>
                  <input type="text" value={victoryMessage} onChange={(e) => setVictoryMessage(e.target.value)} placeholder="Narrative text displayed upon winning..." className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-orange-100" />
                </div>

                <div className="md:col-span-12">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Quest Introduction / Description</label>
                  <textarea 
                    value={questDescription} 
                    onChange={(e) => setQuestDescription(e.target.value)} 
                    placeholder="This story text appears on the introduction screen when the quest begins..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 h-20 resize-none"
                  />
                </div>

                <div className="md:col-span-12 border-t border-gray-700 pt-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Acceptance Criteria (Win Conditions)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Defeat Boss */}
                    <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                      <label className="flex items-center gap-2 mb-2 cursor-pointer">
                        <input type="checkbox" checked={winConditions.defeatBoss.required} onChange={e => setWinConditions({...winConditions, defeatBoss: {...winConditions.defeatBoss, required: e.target.checked}})} className="accent-orange-500" />
                        <span className="text-xs font-bold uppercase">Defeat Boss</span>
                      </label>
                      <select 
                        disabled={!winConditions.defeatBoss.required}
                        value={winConditions.defeatBoss.enemyType} 
                        onChange={e => setWinConditions({...winConditions, defeatBoss: {...winConditions.defeatBoss, enemyType: e.target.value}})}
                        className="w-full bg-gray-800 text-[10px] p-1 rounded border border-gray-600 outline-none"
                      >
                        {Object.keys(ENEMY_TYPES).map(t => <option key={t} value={t}>{ENEMY_TYPES[t].name}</option>)}
                      </select>
                    </div>

                    {/* Collect Story Item */}
                    <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                      <label className="flex items-center gap-2 mb-2 cursor-pointer">
                        <input type="checkbox" checked={winConditions.collectItem.required} onChange={e => setWinConditions({...winConditions, collectItem: {...winConditions.collectItem, required: e.target.checked}})} className="accent-orange-500" />
                        <span className="text-xs font-bold uppercase">Retrieve Item</span>
                      </label>
                      <input 
                        type="text" 
                        disabled={!winConditions.collectItem.required}
                        value={winConditions.collectItem.itemId} 
                        onChange={e => setWinConditions({...winConditions, collectItem: {...winConditions.collectItem, itemId: e.target.value}})}
                        placeholder="Story Item ID..."
                        className="w-full bg-gray-800 text-[10px] p-1 rounded border border-gray-600 outline-none"
                      />
                    </div>

                    {/* Monster Quota */}
                    <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                      <label className="flex items-center gap-2 mb-2 cursor-pointer">
                        <input type="checkbox" checked={winConditions.monsterQuota.required} onChange={e => setWinConditions({...winConditions, monsterQuota: {...winConditions.monsterQuota, required: e.target.checked}})} className="accent-orange-500" />
                        <span className="text-xs font-bold uppercase">Monster Quota</span>
                      </label>
                      <input 
                        type="number" 
                        disabled={!winConditions.monsterQuota.required}
                        value={winConditions.monsterQuota.count} 
                        onChange={e => setWinConditions({...winConditions, monsterQuota: {...winConditions.monsterQuota, count: parseInt(e.target.value) || 0}})}
                        className="w-full bg-gray-800 text-[10px] p-1 rounded border border-gray-600 outline-none text-center"
                      />
                    </div>

                    {/* Mandatory Exfiltration */}
                    <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 flex flex-col justify-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={winConditions.exfiltrate.required} onChange={e => setWinConditions({...winConditions, exfiltrate: {...winConditions.exfiltrate, required: e.target.checked}})} className="accent-orange-500" />
                        <span className="text-xs font-bold uppercase">Exfiltration (Exit Entrance)</span>
                      </label>
                      <p className="text-[9px] text-gray-500 mt-1 italic">Requires player to return to the starting room to win.</p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 border-t border-gray-700 pt-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Turn Limit</label>
                  <input type="number" value={turnLimit} onChange={(e) => setTurnLimit(parseInt(e.target.value) || 0)} placeholder="0 = infinite" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white" />
                </div>
              </div>
            </div>

            {/* Room Editor */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl flex gap-8 items-start">
              <div className="flex-1">
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-end">
                    <div className="flex-1 mr-4">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Room Name</label>
                      <input type="text" value={currentRoom.name} onChange={(e) => updateRoomProp('name', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-xl font-bold text-white outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">X</label>
                        <input type="number" value={currentRoom.coords.x} onChange={(e) => updateRoomProp('x', e.target.value)} className="w-16 bg-gray-900 border border-gray-700 rounded-lg px-2 py-2 text-center" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Y</label>
                        <input type="number" value={currentRoom.coords.y} onChange={(e) => updateRoomProp('y', e.target.value)} className="w-16 bg-gray-900 border border-gray-700 rounded-lg px-2 py-2 text-center" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Room Flavor Text (Story/Narrative)</label>
                    <textarea 
                      value={currentRoom.flavorText || ''} 
                      onChange={(e) => updateRoomProp('flavorText', e.target.value)} 
                      placeholder="Narrative description displayed upon entry..."
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 h-20 resize-none"
                    />
                  </div>
                </div>

                <div className="bg-black p-4 rounded-xl border-4 border-gray-700 inline-block shadow-2xl">
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`, gap: '2px' }}>
                    {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
                      const x = idx % GRID_SIZE; const y = Math.floor(idx / GRID_SIZE);
                      const isDoorCell = (x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1);
                      const door = currentRoom.doors.find(d => d.position.x === x && d.position.y === y);
                      const wall = currentRoom.layout.walls.find(w => w.x === x && w.y === y);
                      const content = getCellContent(x, y);
                      
                      let bg = 'bg-gray-800 hover:bg-gray-700';
                      if (door) bg = door.isLocked ? 'bg-red-900 border-2 border-red-500' : 'bg-green-900 border-2 border-green-500';
                      else if (isDoorCell && !wall) bg = 'bg-gray-700 border-2 border-dashed border-gray-500';

                      return (
                        <button key={`${x}-${y}`} onClick={() => handleGridClick(x, y)} className={`w-12 h-12 rounded flex items-center justify-center text-2xl transition-all active:scale-95 ${bg}`}>
                          {content}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="w-64 space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-widest">Active Tool</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(TOOL_TYPES).map(([key, value]) => (
                      <button key={value} onClick={() => setActiveTool(value)} className={`py-2 px-1 rounded text-[10px] font-black uppercase transition ${activeTool === value ? 'bg-orange-500 text-black shadow-lg scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        {key.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                
                {activeTool === TOOL_TYPES.ENEMY && (
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-widest">Enemy Selection</h3>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {Object.entries(ENEMY_TYPES).map(([type, data]) => (
                        <button key={type} onClick={() => setSelectedEnemy(type)} className={`p-2 rounded-lg text-2xl transition ${selectedEnemy === type ? 'bg-orange-500 scale-110 shadow-lg' : 'bg-gray-800 hover:bg-gray-700'}`} title={type}>
                          {data.emoji}
                        </button>
                      ))}
                    </div>
                    {selectedEnemyData && (
                      <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 space-y-2">
                        <div className="text-sm font-bold text-orange-400 uppercase">{selectedEnemyData.name}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex flex-col">
                            <span className="text-gray-500 font-bold uppercase text-[9px]">Health</span>
                            <span className="text-white font-black">{selectedEnemyData.hp} HP</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-500 font-bold uppercase text-[9px]">Attack</span>
                            <span className="text-white font-black">{selectedEnemyData.attack} DMG</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-500 font-bold uppercase text-[9px]">Speed</span>
                            <span className="text-white font-black">{selectedEnemyData.movementRange} MV</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTool === TOOL_TYPES.TREASURE && (
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-widest">Treasure Type</h3>
                    <select 
                      value={selectedTreasure} 
                      onChange={(e) => setSelectedTreasure(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs mb-3 text-white"
                    >
                      {TREASURE_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    {selectedTreasureData && (
                      <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="text-[10px] text-gray-300 leading-relaxed italic">
                          {selectedTreasureData.description}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Rooms & Validation */}
          <div className="lg:col-span-1 space-y-6">
            {/* Validation Panel */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                Spatial Integrity {validation.errors.length === 0 && validation.warnings.length === 0 ? <CheckCircle2 size={14} className="text-green-500" /> : <AlertCircle size={14} className="text-orange-500" />}
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {validation.errors.map((err, i) => (
                  <div key={i} className="text-[10px] p-2 bg-red-900/30 border border-red-800 text-red-200 rounded leading-tight">
                    <strong>ERROR:</strong> {err.message}
                  </div>
                ))}
                {validation.warnings.map((wrn, i) => (
                  <div key={i} className="text-[10px] p-2 bg-orange-900/30 border border-orange-800 text-orange-200 rounded leading-tight">
                    <strong>WARN:</strong> {wrn.message}
                  </div>
                ))}
                {validation.errors.length === 0 && validation.warnings.length === 0 && (
                  <div className="text-[10px] text-green-500 italic">Dungeon layout is valid.</div>
                )}
              </div>
            </div>

            {/* Evaluation Panel */}
            {evaluation && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Dungeon Evaluation</h3>
                <div className="text-center mb-6">
                  <div className={`text-6xl font-black ${evaluation.color}`}>{evaluation.grade}</div>
                  <div className={`text-sm font-bold uppercase mt-1 ${evaluation.color}`}>{evaluation.label}</div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-bold uppercase">Min. Travel</span>
                    <span className="text-white font-black">{evaluation.travelTurns} Turns</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-bold uppercase">Combat Est.</span>
                    <span className="text-white font-black">{evaluation.combatTurns} Turns</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-bold uppercase">Looting Est.</span>
                    <span className="text-white font-black">{evaluation.searchTurns} Turns</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3 flex justify-between text-xs">
                    <span className="text-orange-400 font-bold uppercase text-[10px]">Expected Total</span>
                    <span className="text-white font-black underline decoration-orange-500">{evaluation.expectedTurns} / {turnLimit}</span>
                  </div>
                </div>
                <div className="mt-6 p-3 bg-gray-900 rounded-lg text-[10px] text-gray-400 italic leading-relaxed">
                  {evaluation.ratio < 1.0 ? "⚠️ The turn limit is too low! Players won't be able to finish." : "This grade estimates the balance between map size, enemy count, and your turn limit."}
                </div>
              </div>
            )}

            {/* Room List */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rooms</h3>
                <button onClick={addRoom} className="p-1 bg-orange-500 rounded text-black hover:bg-orange-400 transition"><Plus size={16} /></button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {rooms.map((room, idx) => {
                  const hasCollision = validation.errors.some(e => e.type === 'collision' && e.ids.includes(room.roomId));
                  const isIsolated = validation.warnings.some(w => w.type === 'isolated' && w.id === room.roomId);
                  
                  return (
                    <div 
                      key={room.roomId} 
                      className={`group flex items-center p-3 rounded-lg cursor-pointer transition border-2 ${
                        currentRoomIndex === idx ? 'bg-orange-500 text-black border-orange-400' : 'bg-gray-900 hover:bg-gray-700 border-transparent'
                      } ${hasCollision ? 'border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : ''}`}
                      onClick={() => setCurrentRoomIndex(idx)}
                    >
                      <div className="flex-1 font-bold truncate">{room.name}</div>
                      <div className={`text-[10px] font-black ml-2 ${isIsolated ? 'text-orange-500' : 'opacity-50'}`}>
                        ({room.coords.x},{room.coords.y})
                      </div>
                      {rooms.length > 1 && currentRoomIndex === idx && (
                        <button onClick={(e) => { e.stopPropagation(); deleteRoom(); }} className="ml-2 p-1 hover:bg-red-600 rounded transition"><Trash2 size={14} /></button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DoorModal({ door, rooms, currentRoom, onSave, onClose }) {
  const [id, setId] = useState(door?.id || `door-${Date.now()}`);
  const [leadsTo, setLeadsTo] = useState(door?.leadsTo || '');
  const [isLocked, setIsLocked] = useState(door?.isLocked || false);
  const [isExit, setIsExit] = useState(door?.isExit || false);
  const [isFake, setIsFake] = useState(door?.isFake || false);
  const [trapDamage, setTrapDamage] = useState(door?.trapDamage || 0);
  const [customMessage, setCustomMessage] = useState(door?.customMessage || '');
  const [requires, setRequires] = useState(door?.requires || []);

  // Gather all potential triggers from the entire dungeon
  const allTriggers = useMemo(() => {
    return rooms.flatMap(r => 
      (r.puzzleObjects || []).map(po => ({
        id: po.id,
        label: `${r.name}: ${po.type === 'plate' ? '🟩 Plate' : '⚙️ Switch'} (${po.id.split('-').pop().slice(-4)})`
      }))
    );
  }, [rooms]);

  // Calculate target coords for spatial matching
  const targetCoords = { x: currentRoom.coords.x, y: currentRoom.coords.y };
  const doorPos = door?.position || door;
  if (doorPos.y === 0) targetCoords.y -= 1;
  else if (doorPos.y === 6) targetCoords.y += 1;
  else if (doorPos.x === 0) targetCoords.x -= 1;
  else if (doorPos.x === 6) targetCoords.x += 1;

  const neighbor = rooms.find(r => r.coords.x === targetCoords.x && r.coords.y === targetCoords.y && r.roomId !== currentRoom.roomId);

  // Auto-detect neighbor if no leadsTo is set yet
  useMemo(() => {
    if (!leadsTo && neighbor && !isExit && !isFake) {
        setLeadsTo(neighbor.roomId);
    }
  }, [neighbor, leadsTo, isExit, isFake]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-black text-orange-400 mb-6 flex items-center gap-2"><Edit3 /> Door Config</h2>
        <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Door ID (Required for puzzles)</label>
            <input type="text" value={id} onChange={e => setId(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-orange-500 transition" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${isExit ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
              <input type="checkbox" checked={isExit} onChange={e => {
                  setIsExit(e.target.checked);
                  if (e.target.checked) {
                      setLeadsTo('');
                      setIsFake(false);
                  }
              }} className="w-5 h-5 accent-orange-500" />
              <div className="flex flex-col">
                <span className="font-black text-sm uppercase">Quest Exit</span>
                <span className="text-[10px] leading-tight">Ends the quest here.</span>
              </div>
            </label>

            <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${isLocked ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
              <input type="checkbox" checked={isLocked} onChange={e => setIsLocked(e.target.checked)} className="w-5 h-5 accent-red-500" />
              <div className="flex flex-col">
                <span className="font-black text-sm uppercase">Locked</span>
                <span className="text-[10px] leading-tight">Requires trigger.</span>
              </div>
            </label>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${isFake ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
              <input type="checkbox" checked={isFake} onChange={e => {
                  setIsFake(e.target.checked);
                  if (e.target.checked) {
                      setLeadsTo('');
                      setIsExit(false);
                  }
              }} className="w-5 h-5 accent-purple-500" />
              <div className="flex flex-col">
                <span className="font-black text-sm uppercase">Fake / Trapped</span>
                <span className="text-[10px] leading-tight">A misleading puzzle door.</span>
              </div>
            </label>
          </div>

          {isFake && (
            <div className="space-y-4 bg-purple-900/10 p-4 rounded-xl border border-purple-500/30">
              <div>
                <label className="block text-xs font-bold text-purple-400 uppercase mb-2">Trap Damage (0 = no damage)</label>
                <input type="number" value={trapDamage} onChange={e => setTrapDamage(parseInt(e.target.value) || 0)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500 transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-purple-400 uppercase mb-2">Custom Interaction Message</label>
                <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} placeholder="e.g. It's just a wall painted to look like a door!" rows="2" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500 transition text-sm" />
              </div>
            </div>
          )}
          
          {!isFake && (
            <div className={isExit ? 'opacity-30 pointer-events-none' : ''}>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Destination Room</label>
              <div className="relative">
                <select 
                  value={leadsTo} 
                  onChange={e => setLeadsTo(e.target.value)}
                  disabled={isExit}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-orange-500 transition appearance-none"
                >
                  <option value="">Select Room...</option>
                  {rooms.map(r => (
                    <option key={r.roomId} value={r.roomId}>{r.name} ({r.coords.x}, {r.coords.y})</option>
                  ))}
                </select>
                {neighbor && !isExit && (
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-bounce shadow-lg">SPATIAL MATCH!</div>
                )}
              </div>
              {neighbor && !isExit && (
                <p className="text-[10px] text-blue-400 mt-2 italic flex items-center gap-1"><CheckCircle2 size={12} /> Detected room "{neighbor.name}" at ({neighbor.coords.x}, {neighbor.coords.y})</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Unlocking Requirements</label>
            {isLocked ? (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2 thin-scrollbar">
                {allTriggers.length > 0 ? allTriggers.map(t => (
                    <label key={t.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 cursor-pointer transition">
                    <input 
                        type="checkbox" 
                        checked={requires.includes(t.id)}
                        onChange={(e) => {
                            if (e.target.checked) setRequires([...requires, t.id]);
                            else setRequires(requires.filter(rid => rid !== t.id));
                        }}
                        className="w-4 h-4 accent-orange-500 rounded"
                    />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-200">{t.label}</span>
                        <span className="text-[8px] text-gray-500 font-mono">{t.id}</span>
                    </div>
                    </label>
                )) : (
                    <div className="text-[10px] text-gray-500 italic py-4 text-center">No triggers (plates/switches) found in any room.</div>
                )}
                </div>
            ) : (
                <div className="bg-gray-900/50 border border-dashed border-gray-700 rounded-lg p-4 text-center text-[10px] text-gray-500">
                    Door must be "Locked" to set requirements.
                </div>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => onSave({ id, leadsTo, isLocked, isExit, isFake, trapDamage, customMessage, requires })} className="flex-1 bg-orange-500 hover:bg-orange-400 text-black font-black py-3 rounded-xl transition shadow-lg">SAVE CONFIG</button>
            <button onClick={onClose} className="px-6 bg-gray-700 hover:bg-gray-600 font-bold py-3 rounded-xl transition">CANCEL</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PuzzleModal({ obj, onSave, onClose, onDelete }) {
  const [triggers, setTriggers] = useState(obj?.triggers?.join(', ') || '');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-black text-blue-400 mb-6 flex items-center gap-2">
          {obj.type === 'plate' ? '🟩 Pressure Plate' : '⚙️ Toggle Switch'}
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">ID (Used by doors to check 'Requires')</label>
            <input type="text" readOnly value={obj.id} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-500 outline-none mb-4" />
            
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Directly Triggers Door IDs (backward compatibility)</label>
            <textarea value={triggers} onChange={e => setTriggers(e.target.value)} placeholder="e.g. exit-door" className="w-full h-24 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 transition" />
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => onSave(triggers)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition">SAVE</button>
            <button onClick={onDelete} className="bg-red-600 hover:bg-red-500 px-4 py-3 rounded-xl transition"><Trash2 size={20} /></button>
            <button onClick={onClose} className="px-6 bg-gray-700 hover:bg-gray-600 font-bold py-3 rounded-xl transition">CANCEL</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryItemModal({ item, onSave, onClose, onDelete }) {
  const [name, setName] = useState(item?.name || 'Mysterious Note');
  const [id, setId] = useState(item?.id || `story-item-${Date.now()}`);
  const [message, setMessage] = useState(item?.message || 'You found a scrap of paper with ancient writing.');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-black text-orange-400 mb-6 flex items-center gap-2">📜 Story Item</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Item Name (Display)</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-orange-500 transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Item ID (For Win Conditions)</label>
            <input type="text" value={id} onChange={e => setId(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-orange-500 transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Narrative Message (On Pickup)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows="3" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-orange-500 transition" />
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => onSave({ name, id, message })} className="flex-1 bg-orange-500 hover:bg-orange-400 text-black font-black py-3 rounded-xl transition">SAVE</button>
            <button onClick={onDelete} className="bg-red-600 hover:bg-red-500 px-4 py-3 rounded-xl transition"><Trash2 size={20} /></button>
            <button onClick={onClose} className="px-6 bg-gray-700 hover:bg-gray-600 font-bold py-3 rounded-xl transition">CANCEL</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NPCModal({ npc, onSave, onClose, onDelete }) {
  const [name, setName] = useState(npc?.name || 'Lost Explorer');
  const [emoji, setEmoji] = useState(npc?.emoji || '🧙');
  // Handle both string and array for backward compatibility
  const initialDialogue = Array.isArray(npc?.dialogue) ? npc.dialogue.join('\n') : (npc?.dialogue || 'Safe travels, adventurer!');
  const [dialogue, setDialogue] = useState(initialDialogue);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-black text-orange-400 mb-6 flex items-center gap-2">👤 NPC Config</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Emoji</label>
              <input type="text" value={emoji} onChange={e => setEmoji(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-2xl text-center outline-none focus:border-orange-500 transition" />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-orange-500 transition" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Dialogue / Message</label>
            <textarea value={dialogue} onChange={e => setDialogue(e.target.value)} rows="6" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-orange-500 transition" />
            <p className="text-[10px] text-gray-500 mt-2 italic">Pro-tip: Each new line will be a separate dialogue box when the player interacts with the NPC in-game.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => onSave({ name, emoji, dialogue })} className="flex-1 bg-orange-500 hover:bg-orange-400 text-black font-black py-3 rounded-xl transition shadow-lg">SAVE CONFIG</button>
            <button onClick={onDelete} className="bg-red-600 hover:bg-red-500 px-4 py-3 rounded-xl transition"><Trash2 size={20} /></button>
            <button onClick={onClose} className="px-6 bg-gray-700 hover:bg-gray-600 font-bold py-3 rounded-xl transition">CANCEL</button>
          </div>
        </div>
      </div>
    </div>
  );
}
