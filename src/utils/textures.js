
export function createFloorPattern(ctx, cellSize) {
    const canvas = document.createElement('canvas');
    canvas.width = cellSize * 2; // Double size for better tiling variation
    canvas.height = cellSize * 2;
    const pCtx = canvas.getContext('2d');

    // Base earth color (warm brown/gray)
    pCtx.fillStyle = '#3d2b1f';
    pCtx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw irregular cobblestones
    const stoneColors = ['#5d4037', '#4e342e', '#3e2723', '#452c1e'];
    
    for (let i = 0; i < 16; i++) {
        const x = (i % 4) * (cellSize / 2) + (Math.random() * 10 - 5);
        const y = Math.floor(i / 4) * (cellSize / 2) + (Math.random() * 10 - 5);
        const w = cellSize / 2 - 2;
        const h = cellSize / 2 - 2;
        
        pCtx.fillStyle = stoneColors[Math.floor(Math.random() * stoneColors.length)];
        
        // Draw slightly irregular rectangle
        pCtx.beginPath();
        pCtx.moveTo(x + 2, y + 2);
        pCtx.lineTo(x + w - 2, y + 1);
        pCtx.lineTo(x + w + 1, y + h - 2);
        pCtx.lineTo(x + 1, y + h + 1);
        pCtx.closePath();
        pCtx.fill();

        // Subtle highlights
        pCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        pCtx.lineWidth = 1;
        pCtx.stroke();
    }

    // Add noise and warm "glow" spots
    for (let i = 0; i < 300; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const opacity = Math.random() * 0.2;
        pCtx.fillStyle = Math.random() > 0.5 ? `rgba(255, 140, 0, ${opacity * 0.5})` : `rgba(0, 0, 0, ${opacity})`;
        pCtx.fillRect(x, y, 1, 1);
    }

    return ctx.createPattern(canvas, 'repeat');
}

export function createWallPattern(ctx, cellSize) {
    const canvas = document.createElement('canvas');
    canvas.width = cellSize;
    canvas.height = cellSize;
    const pCtx = canvas.getContext('2d');

    // Base dark wall
    pCtx.fillStyle = '#1a1a1a';
    pCtx.fillRect(0, 0, cellSize, cellSize);

    // Rough stone blocks
    const wallColors = ['#2c2c2c', '#1f1f1f', '#252525'];
    const brickH = cellSize / 3;
    
    for (let i = 0; i < 3; i++) {
        const y = i * brickH;
        const offset = (i % 2) * (cellSize / 2);
        
        pCtx.fillStyle = wallColors[i % wallColors.length];
        pCtx.fillRect(offset - cellSize + 1, y + 1, cellSize - 2, brickH - 2);
        pCtx.fillRect(offset + 1, y + 1, cellSize - 2, brickH - 2);
        
        // Add "craggy" texture to walls
        pCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        pCtx.beginPath();
        for (let j = 0; j < 5; j++) {
            pCtx.moveTo(offset + Math.random() * cellSize, y + Math.random() * brickH);
            pCtx.lineTo(offset + Math.random() * cellSize, y + Math.random() * brickH);
        }
        pCtx.stroke();
    }

    return ctx.createPattern(canvas, 'repeat');
}
