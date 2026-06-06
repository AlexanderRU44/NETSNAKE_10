export class IntroScreen {
    constructor() {
        this.introTick = 0;
    }

    reset() {
        this.introTick = 0;
    }

    draw(ctx, canvasWidth, canvasHeight, isDarkTheme, flashToggle, playSound) {
        this.introTick++;
        
        ctx.fillStyle = isDarkTheme ? "#0f141c" : "#f7f9fa";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.textAlign = "center";
        
        if (this.introTick > 5) {
            ctx.fillStyle = isDarkTheme ? "#8b949e" : "#2b3a4a";
            ctx.font = "10px 'Press Start 2P'";
            ctx.fillText("RETRO HARDWARE v1.0", 200, 100);
        }
        
        if (this.introTick > 20) {
            ctx.font = "22px 'Press Start 2P'";
            ctx.fillStyle = isDarkTheme ? "#8bac0f" : "#4a90e2";
            ctx.fillText("NETSNAKE 10", 200, 180);
        }
        
        if (this.introTick > 35 && this.introTick <= 75) {
            ctx.fillStyle = isDarkTheme ? "#30363d" : "#ccd1d9";
            ctx.fillRect(80, 240, 240, 12);
            let progress = (this.introTick - 35) / 40;
            ctx.fillStyle = isDarkTheme ? "#58a6ff" : "#2b3a4a";
            ctx.fillRect(80, 240, 240 * progress, 12);
            ctx.font = "8px 'Press Start 2P'";
            ctx.fillStyle = isDarkTheme ? "#8b949e" : "#2b3a4a";
            ctx.fillText("LOADING SYSTEM...", 200, 225);
            if (this.introTick % 10 === 0) playSound("introBeep");
        }
        
        if (this.introTick > 75) {
            ctx.font = "8px 'Press Start 2P'";
            ctx.fillStyle = isDarkTheme ? "#58a6ff" : "#7ed321";
            ctx.fillText("SYSTEM READY OK", 200, 235);
            if (Math.floor(this.introTick / 15) % 2 === 0) {
                ctx.font = "11px 'Press Start 2P'";
                ctx.fillStyle = isDarkTheme ? "#ffffff" : "#2b3a4a";
                ctx.fillText("- PRESS OK/SPACE -", 200, 290);
            }
        }
    }

    isReady() {
        return this.introTick > 75;
    }
}