import { addFloatingScore, playSound } from './utils.js';

export class SpecialModes {
    constructor(game) {
        this.game = game;
        this.coins = [];
        this.portals = [];
    }

    generateCoins() {
        this.coins = [];
        for (let i = 0; i < 15; i++) {
            let x, y, occupied;
            do {
                x = Math.floor(Math.random() * this.game.tileCount);
                y = Math.floor(Math.random() * this.game.tileCount);
                occupied = this.game.snake.some(p => p.x === x && p.y === y) ||
                           (this.game.food && this.game.food.x === x && this.game.food.y === y) ||
                           this.coins.some(c => c.x === x && c.y === y) ||
                           (this.game.gift && this.game.gift.x === x && this.game.gift.y === y) ||
                           (this.game.aiOpponent && this.game.aiOpponent.snake && this.game.aiOpponent.snake.some(p => p.x === x && p.y === y));
                if (this.game.obstacles) occupied = occupied || this.game.obstacles.some(o => o.x === x && o.y === y);
                if (this.game.ghostTrails) occupied = occupied || this.game.ghostTrails.some(g => g.x === x && g.y === y);
            } while (occupied);
            this.coins.push({ x, y, value: 1 });
        }
    }

    generatePortals() {
        this.portals = [];
        for (let i = 0; i < 2; i++) {
            let x, y, occupied;
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
            } while (occupied);
            this.portals.push({ x, y });
        }
    }

    reset() {
        this.coins = [];
        this.portals = [];
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
        if (this.coins.length === 0) this.generateCoins();
        return value;
    }
}