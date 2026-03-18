// src/utils/helpers.js

export function getRandomPosition(layout, occupiedSpaces = []) {
    let position = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    while (attempts < MAX_ATTEMPTS) {
        const x = Math.floor(Math.random() * layout.width);
        const y = Math.floor(Math.random() * layout.height);
        
        const isOccupied = occupiedSpaces.some(p => p.x === x && p.y === y);
        const isDoor = layout.doors.some(d => d.x === x && d.y === y);

        if (!isOccupied && !isDoor) {
            position = { x, y };
            break;
        }
        attempts++;
    }

    if (!position) {
        console.error("Failed to find a random unoccupied position.");
        return { x: 1, y: 1 };
    }

    return position;
}

/**
 * Finds the next best step using Manhattan distance, avoiding obstacles.
 * @param {{x: number, y: number}} startPos
 * @param {{x: number, y: number}} targetPos
 * @param {{width: number, height: number}} layout
 * @param {Array} walls
 * @param {Array} otherActors - Other actors (enemies, player) that are obstacles.
 * @returns {{x: number, y: number}} The next position to move to.
 */
export function findNextStep(startPos, targetPos, layout, walls, otherActors) {
    let bestStep = startPos;
    let minDistance = Math.abs(startPos.x - targetPos.x) + Math.abs(startPos.y - targetPos.y);

    const moves = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

    for (const move of moves) {
        const nextX = startPos.x + move.dx;
        const nextY = startPos.y + move.dy;

        if (nextX < 0 || nextX >= layout.width || nextY < 0 || nextY >= layout.height) {
            continue;
        }

        const isWall = walls.some(w => w.x === nextX && w.y === nextY);
        const isOccupied = otherActors.some(a => a.position.x === nextX && a.position.y === nextY);
        if (isWall || isOccupied) {
            continue;
        }

        const distance = Math.abs(nextX - targetPos.x) + Math.abs(nextY - targetPos.y);
        if (distance < minDistance) {
            minDistance = distance;
            bestStep = { x: nextX, y: nextY };
        }
    }
    return bestStep;
}
