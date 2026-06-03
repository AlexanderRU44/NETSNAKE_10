export class ScreenEffects {
    constructor(game) {
        this.game = game;
        this.miniCanvas = document.getElementById("miniCanvas");
        this.miniCtx = this.miniCanvas ? this.miniCanvas.getContext("2d") : null;
        this.screenElement = document.querySelector('.screen');
        this.nextFoodType = "REGULAR";
    }

    init() {
        if (this.miniCanvas && this.miniCanvas.parentElement && !this.miniCanvas.parentElement.classList.contains('mini-canvas-glitch')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'mini-canvas-glitch';
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            this.miniCanvas.parentNode.insertBefore(wrapper, this.miniCanvas);
            wrapper.appendChild(this.miniCanvas);
        }
        if (this.screenElement && !this.screenElement.classList.contains('screen-glitch')) {
            this.screenElement.classList.add('screen-glitch');
        }
        this.generateNextFoodType();
    }

    drawMiniFood() {
        if (!this.miniCtx) return;
        const ctx = this.miniCtx;
        ctx.clearRect(0, 0, 36, 36);
        
        if (this.game.currentModeIdx === 8) {
            ctx.fillStyle = "#ffd700";
            ctx.fillRect(8, 6, 20, 18);
            ctx.fillRect(6, 10, 24, 12);
            ctx.fillRect(10, 4, 16, 4);
            ctx.fillRect(10, 26, 16, 4);
            ctx.fillStyle = "#b8860b";
            ctx.fillRect(14, 12, 8, 8);
            ctx.fillStyle = "#fff8dc";
            ctx.fillRect(16, 14, 4, 4);
            return;
        }
        
        switch(this.nextFoodType) {
            case "REGULAR":
                ctx.fillStyle = "#ff4d4d";
                ctx.fillRect(8, 6, 20, 18);
                ctx.fillRect(6, 10, 24, 12);
                ctx.fillRect(10, 4, 16, 4);
                ctx.fillRect(10, 26, 16, 4);
                ctx.fillStyle = "#0d1117";
                ctx.fillRect(16, 22, 4, 4);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(12, 12, 4, 4);
                ctx.fillRect(18, 12, 3, 3);
                ctx.fillStyle = "#2d520a";
                ctx.fillRect(18, 4, 5, 3);
                break;
            case "BIG":
                ctx.fillStyle = "#ffb900";
                ctx.fillRect(8, 6, 20, 18);
                ctx.fillRect(6, 10, 24, 12);
                ctx.fillRect(10, 4, 16, 4);
                ctx.fillRect(10, 26, 16, 4);
                ctx.fillStyle = "#0d1117";
                ctx.fillRect(16, 22, 4, 4);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(12, 12, 4, 4);
                ctx.fillRect(18, 12, 3, 3);
                ctx.fillStyle = "#2d520a";
                ctx.fillRect(18, 4, 5, 3);
                break;
            case "SHRINK":
                ctx.fillStyle = "#1e88e5";
                ctx.fillRect(8, 12, 20, 18);
                ctx.fillRect(6, 15, 24, 12);
                ctx.fillRect(10, 10, 16, 4);
                ctx.fillStyle = "#0d1117";
                ctx.fillRect(11, 14, 14, 3);
                ctx.fillRect(20, 18, 6, 5);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(12, 17, 5, 6);
                ctx.fillRect(20, 17, 3, 3);
                ctx.fillStyle = "#2d520a";
                ctx.fillRect(18, 4, 5, 3);
                break;
            case "TURBO":
                ctx.fillStyle = "#ba68c8";
                ctx.fillRect(10, 10, 16, 16);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(14, 14, 4, 4);
                ctx.fillStyle = "#0d1117";
                ctx.fillRect(18, 6, 5, 5);
                ctx.fillStyle = "#2d520a";
                ctx.fillRect(18, 4, 5, 3);
                break;
            case "SHIELD":
                ctx.fillStyle = "#1e88e5";
                ctx.fillRect(6, 6, 24, 24);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(14, 14, 8, 8);
                ctx.fillStyle = "#0d1117";
                ctx.fillRect(16, 16, 4, 4);
                break;
            default:
                ctx.fillStyle = "#ff4d4d";
                ctx.fillRect(8, 6, 20, 18);
                ctx.fillRect(6, 10, 24, 12);
                ctx.fillRect(10, 4, 16, 4);
                ctx.fillRect(10, 26, 16, 4);
                ctx.fillStyle = "#0d1117";
                ctx.fillRect(16, 22, 4, 4);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(12, 12, 4, 4);
                ctx.fillRect(18, 12, 3, 3);
                ctx.fillStyle = "#2d520a";
                ctx.fillRect(18, 4, 5, 3);
        }
    }

    generateNextFoodType() {
        const rand = Math.random();
        let nextType = "REGULAR";
        if (rand < 0.04) nextType = "SHRINK";
        else if (rand < 0.08) nextType = "TURBO";
        else if (rand < 0.12) nextType = "BIG";
        else if (rand < 0.16) nextType = "SHIELD";
        this.nextFoodType = nextType;
        this.drawMiniFood();
    }

    getNewFoodType() {
        const plannedType = this.nextFoodType;
        this.generateNextFoodType();
        return plannedType;
    }

    updateMiniDisplay() {
        this.drawMiniFood();
    }
}