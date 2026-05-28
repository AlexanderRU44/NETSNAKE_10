export class Renderer {
    constructor(ctx, canvas, tileCount, isDarkTheme, snakeColors, getCurrentSnakeColorIdx, getRainbowHue) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.tileCount = tileCount;
        this.isDarkTheme = isDarkTheme;
        this.snakeColors = snakeColors;
        this.getCurrentSnakeColorIdx = getCurrentSnakeColorIdx;
        this.getRainbowHue = getRainbowHue;
    }

    clearCanvas() {
        this.ctx.fillStyle = this.isDarkTheme ? "#0d1117" : "#ffffff"; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = this.isDarkTheme ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)";
        this.ctx.beginPath();
        for (let i = 0; i < this.tileCount; i++) {
            this.ctx.moveTo(i*20,0); this.ctx.lineTo(i*20,400); 
            this.ctx.moveTo(0,i*20); this.ctx.lineTo(400,i*20);
        }
        this.ctx.stroke();
    }

    drawObstacles(obstacles, currentModeIdx, flashToggle, flashingObstacleIdx) {
        if (currentModeIdx !== 2 && currentModeIdx !== 4) return; 
        obstacles.forEach((obs, idx) => {
            if (currentModeIdx === 4 && idx === flashingObstacleIdx && !flashToggle) return;
            this.ctx.fillStyle = this.isDarkTheme ? "#58a6ff" : "#2b3a4a";
            this.ctx.fillRect(obs.x * 20 + 2, obs.y * 20 + 2, 16, 16);
            this.ctx.strokeStyle = this.isDarkTheme ? "#0d1117" : "#ffffff"; 
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(obs.x * 20 + 5, obs.y * 20 + 5, 10, 10);
        });
    }

    drawGhostTrails(ghostTrails, currentModeIdx, flashToggle) {
        if (currentModeIdx !== 3) return; 
        ghostTrails.forEach(gt => {
            this.ctx.fillStyle = this.isDarkTheme 
                ? (flashToggle ? "rgba(88, 166, 255, 0.4)" : "rgba(88, 166, 255, 0.15)")
                : (flashToggle ? "rgba(43, 58, 74, 0.5)" : "rgba(43, 58, 74, 0.2)");
            this.ctx.fillRect(gt.x * 20 + 4, gt.y * 20 + 4, 12, 12);
        });
    }

    drawSnake(snake, rainbowHue) {
        const activeColor = this.snakeColors[this.getCurrentSnakeColorIdx()];
        snake.forEach((part, i) => {
            if (activeColor.hex === "RAINBOW") {
                this.ctx.fillStyle = `hsl(${(rainbowHue + i * 15) % 360}, 90%, 45%)`;
            } else if (activeColor.hex === "DYNAMIC") {
                this.ctx.fillStyle = this.isDarkTheme ? "#ecf2f8" : "#2b3a4a";
            } else {
                this.ctx.fillStyle = activeColor.hex; 
            }
            this.ctx.fillRect(part.x * 20 + 1, part.y * 20 + 1, 18, 18);
            if (i === 0) { 
                if (activeColor.eyeHex === "DYNAMIC") this.ctx.fillStyle = this.isDarkTheme ? "#0d1117" : "#ffffff";
                else this.ctx.fillStyle = activeColor.eyeHex; 
                this.ctx.fillRect(part.x * 20 + 4, part.y * 20 + 4, 4, 4); 
            }
        });
    }

    drawFood(food, foodType, flashToggle) {
        if (foodType !== "REGULAR" && !flashToggle) return; 
        const px = food.x * 20; const py = food.y * 20;
        const darkSubColor = this.isDarkTheme ? "#0d1117" : "#2b3a4a";
        if (foodType === "REGULAR") {
            this.ctx.fillStyle = "#ff4d4d"; this.ctx.fillRect(px + 5, py + 4, 10, 12); this.ctx.fillRect(px + 4, py + 6, 12, 8);
            this.ctx.fillRect(px + 6, py + 3, 8, 1); this.ctx.fillRect(px + 6, py + 16, 8, 1);
            this.ctx.fillStyle = darkSubColor; this.ctx.fillRect(px + 9, py + 13, 2, 2);
            this.ctx.fillStyle = "#ffffff"; this.ctx.fillRect(px + 6, py + 6, 2, 2); this.ctx.fillRect(px + 8, py + 6, 1, 1);
            this.ctx.fillStyle = darkSubColor; this.ctx.fillRect(px + 9, py + 1, 1, 2);
            this.ctx.fillStyle = "#4e8a10"; this.ctx.fillRect(px + 10, py + 1, 2, 1);
        } else if (foodType === "BIG") {
            this.ctx.fillStyle = "#ffb900"; this.ctx.fillRect(px + 5, py + 4, 10, 12); this.ctx.fillRect(px + 4, py + 6, 12, 8);
            this.ctx.fillRect(px + 6, py + 3, 8, 1); this.ctx.fillRect(px + 6, py + 16, 8, 1);
            this.ctx.fillStyle = darkSubColor; this.ctx.fillRect(px + 9, py + 13, 2, 2);
            this.ctx.fillStyle = "#ffffff"; this.ctx.fillRect(px + 6, py + 6, 2, 2); this.ctx.fillRect(px + 8, py + 6, 1, 1);
            this.ctx.fillStyle = darkSubColor; this.ctx.fillRect(px + 9, py + 1, 1, 2);
            this.ctx.fillStyle = "#2d520a"; this.ctx.fillRect(px + 10, py + 1, 2, 1);
        } else if (foodType === "SHRINK") {
            this.ctx.fillStyle = this.isDarkTheme ? "#1a1c1e" : "#f0f2f5"; this.ctx.fillRect(px + 8, py + 2, 4, 1); 
            this.ctx.fillStyle = darkSubColor; this.ctx.fillRect(px + 9, py + 3, 2, 3); 
            this.ctx.fillStyle = "#1e88e5"; this.ctx.fillRect(px + 5, py + 7, 10, 10); this.ctx.fillRect(px + 4, py + 9, 12, 6); this.ctx.fillRect(px + 6, py + 6, 8, 1);
            this.ctx.fillStyle = darkSubColor; this.ctx.fillRect(px + 5, py + 8, 10, 1); this.ctx.fillRect(px + 11, py + 11, 2, 2);
            this.ctx.fillStyle = "#ffffff"; this.ctx.fillRect(px + 6, py + 10, 2, 3); this.ctx.fillRect(px + 8, py + 10, 1, 1);
        } else if (foodType === "TURBO") { 
            this.ctx.fillStyle = "#ba68c8"; this.ctx.fillRect(px + 4, py + 4, 12, 12);
            this.ctx.fillStyle = "#ffffff"; this.ctx.fillRect(px + 6, py + 6, 3, 3);
            this.ctx.fillStyle = darkSubColor; this.ctx.fillRect(px + 9, py + 2, 2, 2);
        }
    }

    drawGift(gift, flashToggle) {
        if (!gift) return;
        const px = gift.x * 20; const py = gift.y * 20;
        const darkSubColor = this.isDarkTheme ? "#0d1117" : "#2b3a4a";
        this.ctx.fillStyle = "#ff4d4d"; this.ctx.fillRect(px + 3, py + 7, 14, 11); this.ctx.fillRect(px + 2, py + 5, 16, 3);
        this.ctx.fillStyle = darkSubColor; this.ctx.fillRect(px + 9, py + 5, 2, 13); this.ctx.fillRect(px + 3, py + 11, 14, 2);
        this.ctx.fillStyle = "#ff4d4d";
        if (flashToggle) {
            this.ctx.fillRect(px + 6, py + 2, 3, 3); this.ctx.fillRect(px + 11, py + 2, 3, 3);
            this.ctx.fillStyle = darkSubColor; this.ctx.fillRect(px + 9, py + 3, 2, 2);
        } else {
            this.ctx.fillRect(px + 5, py + 3, 3, 2); this.ctx.fillRect(px + 12, py + 3, 3, 2);
            this.ctx.fillStyle = darkSubColor; this.ctx.fillRect(px + 9, py + 4, 2, 1);
        }
    }

    drawFloatingScores(floatingScores) {
        this.ctx.save();
        this.ctx.font = "8px 'Press Start 2P'";
        this.ctx.textAlign = "center";
        for (let i = floatingScores.length - 1; i >= 0; i--) {
            let fs = floatingScores[i];
            this.ctx.fillStyle = this.isDarkTheme ? `rgba(236, 242, 248, ${fs.alpha})` : `rgba(43, 58, 74, ${fs.alpha})`;
            this.ctx.fillText(fs.text, fs.x, fs.y);
            fs.y -= 1.2; fs.life--;
            if (fs.life <= 5) fs.alpha -= 0.2;
            if (fs.life <= 0) floatingScores.splice(i, 1);
        }
        this.ctx.restore();
    }
}