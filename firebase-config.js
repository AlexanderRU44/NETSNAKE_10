export class AnimationController {
    constructor(game) {
        this.game = game;
        this._rafId = null;
        this._lastFrameTime = 0;
        this.animationLoop = this.animationLoop.bind(this);
    }

    updateTicker() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        this._lastFrameTime = 0;
        this._rafId = requestAnimationFrame(this.animationLoop);
    }

    animationLoop(now) {
        if (!this._lastFrameTime) {
            this._lastFrameTime = now;
            this._rafId = requestAnimationFrame(this.animationLoop);
            return;
        }
        let activeSpeed = this.game.isTurboActive ? this.game.speeds[2] : this.game.speeds[this.game.currentSpeedMode];
        let tickSpeed = (this.game.currentScreen === "INTRO") ? 33 : activeSpeed;
        if (now - this._lastFrameTime >= tickSpeed) {
            this.game.gameLoop();
            this._lastFrameTime = now;
        }
        this._rafId = requestAnimationFrame(this.animationLoop);
    }

    stop() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }
}