export class Renderer {
    constructor(ctx, canvas, tileCount, isDarkTheme, snakeColors, getCurrentSnakeColorIdx, getRainbowHue) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.tileCount = tileCount;
        this.isDarkTheme = isDarkTheme;
        this.snakeColors = snakeColors;
        this.getCurrentSnakeColorIdx = getCurrentSnakeColorIdx;
        this.getRainbowHue = getRainbowHue;
        this._cellSize = 20;
        this._needsGridRedraw = true;
    }

    clearCanvas() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        ctx.fillStyle = this.isDarkTheme ? "#0d1117" : "#ffffff";
        ctx.fillRect(0, 0, w, h);
        
        if (this._needsGridRedraw) {
            ctx.strokeStyle = this.isDarkTheme ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)";
            ctx.beginPath();
            for (let i = 0; i <= this.tileCount; i++) {
                const pos = i * this._cellSize;
                ctx.moveTo(pos, 0);
                ctx.lineTo(pos, h);
                ctx.moveTo(0, pos);
                ctx.lineTo(w, pos);
            }
            ctx.stroke();
            this._needsGridRedraw = false;
        }
    }

    drawObstacles(obstacles, currentModeIdx, flashToggle, flashingObstacleIdx) {
        // Отрисовка камней для режима 2 (КАМНИ) и режима 4 (ДВИЖ. КАМНИ)
        if (currentModeIdx !== 2 && currentModeIdx !== 4) return;
        
        if (!obstacles || obstacles.length === 0) return;
        
        const ctx = this.ctx;
        const cellSize = this._cellSize;
        const isDark = this.isDarkTheme;
        
        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            // Пропускаем мигающий камень при flashToggle = false
            if (currentModeIdx === 4 && i === flashingObstacleIdx && !flashToggle) continue;
            
            const x = obs.x * cellSize;
            const y = obs.y * cellSize;
            
            // Основной цвет камня
            ctx.fillStyle = isDark ? "#4a6a8a" : "#6c7d93";
            ctx.fillRect(x + 2, y + 2, 16, 16);
            
            // Темная часть камня (тень)
            ctx.fillStyle = isDark ? "#2a3a4a" : "#4a5a6a";
            ctx.fillRect(x + 4, y + 4, 12, 12);
            
            // Светлая часть камня (блик)
            ctx.fillStyle = isDark ? "#6a8aaa" : "#8c9daf";
            ctx.fillRect(x + 6, y + 6, 4, 4);
            ctx.fillRect(x + 12, y + 10, 3, 3);
            
            // Контур камня
            ctx.strokeStyle = isDark ? "#1a2a3a" : "#3a4a5a";
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 2, y + 2, 16, 16);
        }
    }

    drawGhostTrails(ghostTrails, currentModeIdx, flashToggle) {
        if (currentModeIdx !== 3 || ghostTrails.length === 0) return;
        
        const ctx = this.ctx;
        const cellSize = this._cellSize;
        const isDark = this.isDarkTheme;
        
        for (let i = 0; i < ghostTrails.length; i++) {
            const gt = ghostTrails[i];
            ctx.fillStyle = isDark 
                ? (flashToggle ? "rgba(88, 166, 255, 0.4)" : "rgba(88, 166, 255, 0.15)")
                : (flashToggle ? "rgba(43, 58, 74, 0.5)" : "rgba(43, 58, 74, 0.2)");
            ctx.fillRect(gt.x * cellSize + 4, gt.y * cellSize + 4, 12, 12);
        }
    }

    drawSnake(snake, rainbowHue) {
        const ctx = this.ctx;
        const activeColor = this.snakeColors[this.getCurrentSnakeColorIdx()];
        const isRainbow = activeColor.hex === "RAINBOW";
        const isDynamic = activeColor.hex === "DYNAMIC";
        const baseColor = isDynamic ? (this.isDarkTheme ? "#ecf2f8" : "#2b3a4a") : activeColor.hex;
        const eyeColor = (activeColor.eyeHex === "DYNAMIC") ? (this.isDarkTheme ? "#0d1117" : "#ffffff") : activeColor.eyeHex;
        const cellSize = this._cellSize;
        
        for (let i = 0; i < snake.length; i++) {
            const part = snake[i];
            const x = part.x * cellSize;
            const y = part.y * cellSize;
            
            if (isRainbow) {
                ctx.fillStyle = `hsl(${(rainbowHue + i * 15) % 360}, 90%, 45%)`;
            } else {
                ctx.fillStyle = baseColor;
            }
            ctx.fillRect(x + 1, y + 1, 18, 18);
            
            if (i === 0) {
                ctx.fillStyle = eyeColor;
                ctx.fillRect(x + 4, y + 4, 4, 4);
                ctx.fillRect(x + 12, y + 4, 4, 4);
            }
        }
    }

    drawAIOpponent(aiSnake) {
        if (!aiSnake || aiSnake.length === 0) return;
        
        const ctx = this.ctx;
        const cellSize = this._cellSize;
        
        for (let i = 0; i < aiSnake.length; i++) {
            const part = aiSnake[i];
            const x = part.x * cellSize;
            const y = part.y * cellSize;
            
            ctx.fillStyle = this.isDarkTheme ? "#ff6b6b" : "#d63031";
            ctx.fillRect(x + 1, y + 1, 18, 18);
            
            if (i === 0) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(x + 4, y + 4, 4, 4);
                ctx.fillRect(x + 12, y + 4, 4, 4);
            }
        }
    }

    drawFood(food, foodType, flashToggle) {
        if (foodType !== "REGULAR" && !flashToggle) return;
        
        const ctx = this.ctx;
        const px = food.x * this._cellSize;
        const py = food.y * this._cellSize;
        const darkSubColor = this.isDarkTheme ? "#0d1117" : "#2b3a4a";
        
        switch(foodType) {
            case "REGULAR":
                ctx.fillStyle = "#ff4d4d";
                ctx.fillRect(px + 5, py + 4, 10, 12);
                ctx.fillRect(px + 4, py + 6, 12, 8);
                ctx.fillRect(px + 6, py + 3, 8, 1);
                ctx.fillRect(px + 6, py + 16, 8, 1);
                ctx.fillStyle = darkSubColor;
                ctx.fillRect(px + 9, py + 13, 2, 2);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(px + 6, py + 6, 2, 2);
                ctx.fillRect(px + 8, py + 6, 1, 1);
                ctx.fillStyle = darkSubColor;
                ctx.fillRect(px + 9, py + 1, 1, 2);
                ctx.fillStyle = "#4e8a10";
                ctx.fillRect(px + 10, py + 1, 2, 1);
                break;
            case "BIG":
                ctx.fillStyle = "#ffb900";
                ctx.fillRect(px + 5, py + 4, 10, 12);
                ctx.fillRect(px + 4, py + 6, 12, 8);
                ctx.fillRect(px + 6, py + 3, 8, 1);
                ctx.fillRect(px + 6, py + 16, 8, 1);
                ctx.fillStyle = darkSubColor;
                ctx.fillRect(px + 9, py + 13, 2, 2);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(px + 6, py + 6, 2, 2);
                ctx.fillRect(px + 8, py + 6, 1, 1);
                ctx.fillStyle = darkSubColor;
                ctx.fillRect(px + 9, py + 1, 1, 2);
                ctx.fillStyle = "#2d520a";
                ctx.fillRect(px + 10, py + 1, 2, 1);
                break;
            case "SHRINK":
                ctx.fillStyle = this.isDarkTheme ? "#1a1c1e" : "#f0f2f5";
                ctx.fillRect(px + 8, py + 2, 4, 1);
                ctx.fillStyle = darkSubColor;
                ctx.fillRect(px + 9, py + 3, 2, 3);
                ctx.fillStyle = "#1e88e5";
                ctx.fillRect(px + 5, py + 7, 10, 10);
                ctx.fillRect(px + 4, py + 9, 12, 6);
                ctx.fillRect(px + 6, py + 6, 8, 1);
                ctx.fillStyle = darkSubColor;
                ctx.fillRect(px + 5, py + 8, 10, 1);
                ctx.fillRect(px + 11, py + 11, 2, 2);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(px + 6, py + 10, 2, 3);
                ctx.fillRect(px + 8, py + 10, 1, 1);
                break;
            case "TURBO":
                ctx.fillStyle = "#ba68c8";
                ctx.fillRect(px + 4, py + 4, 12, 12);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(px + 6, py + 6, 3, 3);
                ctx.fillStyle = darkSubColor;
                ctx.fillRect(px + 9, py + 2, 2, 2);
                break;
        }
    }

    drawGift(gift, flashToggle) {
        if (!gift) return;
        
        const ctx = this.ctx;
        const px = gift.x * this._cellSize;
        const py = gift.y * this._cellSize;
        const darkSubColor = this.isDarkTheme ? "#0d1117" : "#2b3a4a";
        
        ctx.fillStyle = "#ff4d4d";
        ctx.fillRect(px + 3, py + 7, 14, 11);
        ctx.fillRect(px + 2, py + 5, 16, 3);
        ctx.fillStyle = darkSubColor;
        ctx.fillRect(px + 9, py + 5, 2, 13);
        ctx.fillRect(px + 3, py + 11, 14, 2);
        ctx.fillStyle = "#ff4d4d";
        
        if (flashToggle) {
            ctx.fillRect(px + 6, py + 2, 3, 3);
            ctx.fillRect(px + 11, py + 2, 3, 3);
            ctx.fillStyle = darkSubColor;
            ctx.fillRect(px + 9, py + 3, 2, 2);
        } else {
            ctx.fillRect(px + 5, py + 3, 3, 2);
            ctx.fillRect(px + 12, py + 3, 3, 2);
            ctx.fillStyle = darkSubColor;
            ctx.fillRect(px + 9, py + 4, 2, 1);
        }
    }

    drawFloatingScores(floatingScores) {
        const ctx = this.ctx;
        ctx.save();
        ctx.font = "8px 'Press Start 2P'";
        ctx.textAlign = "center";
        
        for (let i = floatingScores.length - 1; i >= 0; i--) {
            const fs = floatingScores[i];
            ctx.fillStyle = this.isDarkTheme ? `rgba(236, 242, 248, ${fs.alpha})` : `rgba(43, 58, 74, ${fs.alpha})`;
            ctx.fillText(fs.text, fs.x, fs.y);
            fs.y -= 1.2;
            fs.life--;
            if (fs.life <= 5) fs.alpha -= 0.2;
            if (fs.life <= 0) floatingScores.splice(i, 1);
        }
        ctx.restore();
    }
}