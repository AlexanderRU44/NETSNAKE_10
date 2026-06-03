// touchControls.js
export class TouchControls {
    constructor(game, canvas) {
        this.game = game;
        this.canvas = canvas;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.isTouchMoving = false;
        this.swipeThreshold = 20;
        
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        
        this.init();
    }

    init() {
        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
        this.canvas.addEventListener('click', this.handleCanvasClick);
    }

    handleTouchStart(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.touchStartX = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
        this.touchStartY = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
        this.touchStartTime = Date.now();
        this.isTouchMoving = false;
    }

    handleTouchMove(e) {
        e.preventDefault();
        this.isTouchMoving = true;
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.isTouchMoving && (Date.now() - this.touchStartTime) < 200) {
            if (this.game.currentScreen === "ABOUT") {
                if (this.game.menuDrawer?.checkGithubClick(this.touchStartX, this.touchStartY)) return;
            }
            this.handleTap();
            return;
        }
        if (this.isTouchMoving) {
            const rect = this.canvas.getBoundingClientRect();
            let endX = this.touchStartX;
            let endY = this.touchStartY;
            if (e.changedTouches.length > 0) {
                endX = (e.changedTouches[0].clientX - rect.left) * (this.canvas.width / rect.width);
                endY = (e.changedTouches[0].clientY - rect.top) * (this.canvas.height / rect.height);
            }
            const deltaX = endX - this.touchStartX;
            const deltaY = endY - this.touchStartY;
            if (Math.abs(deltaX) > this.swipeThreshold || Math.abs(deltaY) > this.swipeThreshold) {
                this.handleSwipe(deltaX, deltaY);
            }
        }
        this.isTouchMoving = false;
    }

    handleTap() {
        if (this.game.currentScreen === "INTRO") {
            this.game.handleCenter();
            return;
        }
        if (this.game.currentScreen === "EDIT_NAME") return;
        if (this.game.isPaused || this.game.currentScreen !== "GAME") {
            this.game.handleCenter();
        }
    }

    handleSwipe(deltaX, deltaY) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        let direction = null;
        if (absX > absY) {
            direction = deltaX > 0 ? "RIGHT" : "LEFT";
        } else {
            direction = deltaY > 0 ? "DOWN" : "UP";
        }
        if (!this.game.isPaused && !this.game.gameOver && this.game.currentScreen !== "INTRO" && this.game.currentScreen !== "EDIT_NAME") {
            this.game.handleInput(direction);
        } 
        else if (this.game.isPaused || (this.game.currentScreen !== "GAME" && this.game.currentScreen !== "INTRO" && this.game.currentScreen !== "EDIT_NAME")) {
            if (direction === "UP") this.game.handleInput("UP");
            else if (direction === "DOWN") this.game.handleInput("DOWN");
        }
    }

    handleCanvasClick(e) {
        if (this.game.currentScreen === "ABOUT") {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;
            this.game.menuDrawer?.checkGithubClick(mouseX, mouseY);
        }
    }
}