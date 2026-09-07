import { addFloatingScore, playSound } from './utils.js';

export class SpecialModes {
    constructor(game) {
        this.game = game;
        this.coins = [];
        this.portals = [];
        this.portalMoveTimer = 0;
        this.portalMoveInterval = 5000; // 5 секунд
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
                // Не размещать порталы на монетах
                if (this.game.currentModeIdx === 9) {
                    occupied = occupied || this.portals.some(p => p.x === x && p.y === y);
                }
            } while (occupied);
            this.coins.push({ x, y, value: 1 });
        }
    }

    generatePortals() {
        this.portals = [];
        this.portalMoveTimer = 0;
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
                // Не размещать порталы слишком близко друг к другу
                if (this.portals.length === 1) {
                    const dx = Math.abs(x - this.portals[0].x);
                    const dy = Math.abs(y - this.portals[0].y);
                    if (dx + dy < 5) occupied = true;
                }
                // Не размещать порталы слишком близко к голове змеи
                if (this.game.snake.length > 0) {
                    const head = this.game.snake[0];
                    if (Math.abs(x - head.x) + Math.abs(y - head.y) < 4) occupied = true;
                }
            } while (occupied);
            this.portals.push({ x, y });
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
        if (this.coins.length === 0) this.generateCoins();
        return value;
    }

    // Новый метод для обновления позиций порталов
    updatePortals(tickSpeed) {
        if (this.game.currentModeIdx !== 9 || this.portals.length !== 2) return;
        if (this.game.isPaused || this.game.gameOver) return;
        
        this.portalMoveTimer += tickSpeed;
        
        if (this.portalMoveTimer >= this.portalMoveInterval) {
            this.portalMoveTimer = 0;
            this.movePortals();
        }
    }

    // Метод для перемещения порталов
    movePortals() {
        if (this.portals.length !== 2) return;
        
        // Сохраняем старые позиции для анимации
        const oldPortals = this.portals.map(p => ({...p}));
        
        // Генерируем новые позиции для каждого портала
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
                // Не размещать портал на другом портале
                if (i === 0) {
                    occupied = occupied || (this.portals[1] && this.portals[1].x === x && this.portals[1].y === y);
                } else {
                    occupied = occupied || (this.portals[0] && this.portals[0].x === x && this.portals[0].y === y);
                }
                // Не размещать слишком близко к другому порталу
                if (i === 1 && this.portals.length > 0) {
                    const otherPortal = this.portals[0];
                    if (otherPortal) {
                        const dx = Math.abs(x - otherPortal.x);
                        const dy = Math.abs(y - otherPortal.y);
                        if (dx + dy < 5) occupied = true;
                    }
                }
                // Не размещать слишком близко к голове змеи
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
        
        // Показываем эффект перемещения
        if (this.game.particleSystem) {
            for (let p of oldPortals) {
                this.game.particleSystem.addExplosion(p.x, p.y, "#8a2be2", 8);
            }
            for (let p of this.portals) {
                this.game.particleSystem.addExplosion(p.x, p.y, "#4b0082", 8);
            }
        }
        
        // Звук перемещения порталов
        playSound("foodMove", this.game.soundEnabled);
        
        // Добавляем всплывающую надпись
        const t = this.game.i18n[this.game.currentLang];
        for (let p of this.portals) {
            addFloatingScore(this.game.floatingScores, p.x, p.y, "PORTAL!", this.game.currentLang);
        }
    }
}