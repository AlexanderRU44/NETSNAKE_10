import { addFloatingScore, playSound } from './utils.js';

export class SpecialModes {
    constructor(game) {
        this.game = game;
        this.coins = [];
        this.portals = [];
        this.portalMoveTimer = 0;
        this.portalMoveInterval = 5000;
    }

    generateCoins() {
        this.coins = [];
        const coinCount = 30;
        for (let i = 0; i < coinCount; i++) {
            let x, y, occupied;
            let attempts = 0;
            do {
                x = Math.floor(Math.random() * this.game.tileCount);
                y = Math.floor(Math.random() * this.game.tileCount);
                occupied = this.game.snake.some(p => p.x === x && p.y === y) ||
                           this.coins.some(c => c.x === x && c.y === y) ||
                           (this.game.gift && this.game.gift.x === x && this.game.gift.y === y) ||
                           (this.game.aiOpponent && this.game.aiOpponent.snake && this.game.aiOpponent.snake.some(p => p.x === x && p.y === y));
                if (this.game.obstacles) occupied = occupied || this.game.obstacles.some(o => o.x === x && o.y === y);
                if (this.game.ghostTrails) occupied = occupied || this.game.ghostTrails.some(g => g.x === x && g.y === y);
                if (this.game.currentModeIdx === 9) {
                    occupied = occupied || this.portals.some(p => p.x === x && p.y === y);
                }
                attempts++;
                if (attempts > 100) break;
            } while (occupied);
            if (attempts <= 100) {
                this.coins.push({ x, y, value: 1 });
            }
        }
    }

    generatePortals() {
        this.portals = [];
        this.portalMoveTimer = 0;
        for (let i = 0; i < 2; i++) {
            let x, y, occupied;
            // FIX: добавлен счётчик попыток, чтобы избежать бесконечного цикла
            let attempts = 0;
            do {
                x = Math.floor(Math.random() * this.game.tileCount);
                y = Math.floor(Math.random() * this.game.tileCount);
                occupied = this.game.snake.some(p => p.x === x && p.y === y) ||
                           (this.game.food && this.game.food.x === x && this.game.food.y === y) ||
                           this.portals.some(p => p.x === x && p.y === y) ||
                           (this.game.gift && this.game.gift.x === x && this.game.gift.y === y) ||
                           (this.game.aiOpponent && this.game.aiOpponent.snake && this.game.aiOpponent.snake.some(p => p.x === x && p.y === y));
                if (this.game.obstacles) occupied = occupied || this.game.obstacles.some(o => o.x === x && o.y === y);
                if (this.game.ghostTrails) occupied = occupied || this.game.ghostTrails.some(g => g.x === x && g.y === y);
                if (this.portals.length === 1) {
                    const dx = Math.abs(x - this.portals[0].x);
                    const dy = Math.abs(y - this.portals[0].y);
                    if (dx + dy < 5) occupied = true;
                }
                if (this.game.snake.length > 0) {
                    const head = this.game.snake[0];
                    if (Math.abs(x - head.x) + Math.abs(y - head.y) < 4) occupied = true;
                }
                if (this.game.currentModeIdx === 8) {
                    occupied = occupied || this.game.specialModes.coins.some(c => c.x === x && c.y === y);
                }
                attempts++;
                if (attempts > 100) break;
            } while (occupied);

            if (attempts <= 100) {
                this.portals.push({ x, y });
            } else {
                // FIX: fallback — ищем любую свободную клетку
                let placed = false;
                for (let fx = 0; fx < this.game.tileCount && !placed; fx++) {
                    for (let fy = 0; fy < this.game.tileCount && !placed; fy++) {
                        const busy = this.game.snake.some(p => p.x === fx && p.y === fy) ||
                                     this.portals.some(p => p.x === fx && p.y === fy) ||
                                     (this.game.obstacles && this.game.obstacles.some(o => o.x === fx && o.y === fy));
                        if (!busy) {
                            this.portals.push({ x: fx, y: fy });
                            placed = true;
                        }
                    }
                }
            }
        }
    }

    reset() {
        this.coins = [];
        this.portals = [];
        this.portalMoveTimer = 0;
        if (this.game.currentModeIdx === 8) this.generateCoins();
        if (this.game.currentModeIdx === 9) this.generatePortals();
    }

    isPortalCell(x, y) {
        return this.portals.some(p => p.x === x && p.y === y);
    }

    teleportIfNeeded(head) {
        if (this.game.currentModeIdx !== 9 || this.portals.length !== 2) return null;
        const idx = this.portals.findIndex(p => p.x === head.x && p.y === head.y);
        if (idx === -1) return null;
        const target = this.portals[idx === 0 ? 1 : 0];
        playSound("turboEat", this.game.soundEnabled);
        const t = this.game.i18n[this.game.currentLang];
        addFloatingScore(this.game.floatingScores, head.x, head.y, t.portal, this.game.currentLang);
        return { x: target.x, y: target.y };
    }

    collectCoin(head) {
        if (this.game.currentModeIdx !== 8) return 0;
        const idx = this.coins.findIndex(c => c.x === head.x && c.y === head.y);
        if (idx === -1) return 0;
        playSound("eat", this.game.soundEnabled);
        const value = this.coins[idx].value;
        this.coins.splice(idx, 1);
        if (this.coins.length === 0) {
            this.generateCoins();
            if (this.game.particleSystem) {
                for (let coin of this.coins) {
                    this.game.particleSystem.addExplosion(coin.x, coin.y, "#ffd700", 4);
                }
            }
        }
        return value;
    }

    updatePortals(tickSpeed) {
        if (this.game.currentModeIdx !== 9 || this.portals.length !== 2) return;
        if (this.game.isPaused || this.game.gameOver) return;

        this.portalMoveTimer += tickSpeed;

        if (this.portalMoveTimer >= this.portalMoveInterval) {
            this.portalMoveTimer = 0;
            this.movePortals();
        }
    }

    movePortals() {
        if (this.portals.length !== 2) return;

        const oldPortals = this.portals.map(p => ({...p}));

        for (let i = 0; i < this.portals.length; i++) {
            let x, y, occupied;
            let attempts = 0;
            do {
                x = Math.floor(Math.random() * this.game.tileCount);
                y = Math.floor(Math.random() * this.game.tileCount);
                occupied = this.game.snake.some(p => p.x === x && p.y === y) ||
                           (this.game.food && this.game.food.x === x && this.game.food.y === y) ||
                           (this.game.gift && this.game.gift.x === x && this.game.gift.y === y) ||
                           (this.game.aiOpponent && this.game.aiOpponent.snake && this.game.aiOpponent.snake.some(p => p.x === x && p.y === y));
                if (this.game.obstacles) occupied = occupied || this.game.obstacles.some(o => o.x === x && o.y === y);
                if (this.game.ghostTrails) occupied = occupied || this.game.ghostTrails.some(g => g.x === x && g.y === y);
                if (i === 0) {
                    occupied = occupied || (this.portals[1] && this.portals[1].x === x && this.portals[1].y === y);
                } else {
                    occupied = occupied || (this.portals[0] && this.portals[0].x === x && this.portals[0].y === y);
                }
                if (i === 1 && this.portals.length > 0) {
                    const otherPortal = this.portals[0];
                    if (otherPortal) {
                        const dx = Math.abs(x - otherPortal.x);
                        const dy = Math.abs(y - otherPortal.y);
                        if (dx + dy < 5) occupied = true;
                    }
                }
                if (this.game.snake.length > 0) {
                    const head = this.game.snake[0];
                    if (Math.abs(x - head.x) + Math.abs(y - head.y) < 4) occupied = true;
                }
                attempts++;
                if (attempts > 100) break;
            } while (occupied);

            if (attempts <= 100) {
                this.portals[i] = { x, y };
            }
        }

        if (this.game.particleSystem) {
            for (let p of oldPortals) {
                this.game.particleSystem.addExplosion(p.x, p.y, "#8a2be2", 8);
            }
            for (let p of this.portals) {
                this.game.particleSystem.addExplosion(p.x, p.y, "#4b0082", 8);
            }
        }

        playSound("foodMove", this.game.soundEnabled);

        for (let p of this.portals) {
            addFloatingScore(this.game.floatingScores, p.x, p.y, "PORTAL!", this.game.currentLang);
        }
    }
}