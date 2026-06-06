import { playSound, addFloatingScore } from './utils.js';
import { completeTask, checkScoreTasks } from './tasks.js';
import { unlockAchievement } from './achievements.js';
import { achievements } from './achievements.js';
import { tasks } from './tasks.js';

export class GameMechanics {
    constructor(game) {
        this.game = game;
        this.timeAccumulator = 0;
    }

    moveSnake() {
        let dx = this.game.dx;
        let dy = this.game.dy;
        let head = { x: this.game.snake[0].x + dx, y: this.game.snake[0].y + dy };
        
        // Телепортация через стены (кроме режима 1)
        if (this.game.currentModeIdx !== 1) {
            head.x = (head.x + this.game.tileCount) % this.game.tileCount;
            head.y = (head.y + this.game.tileCount) % this.game.tileCount;
        }
        
        // Призрачные следы (режим 3)
        if (this.game.currentModeIdx === 3 && this.game.snake.length) {
            const tail = this.game.snake[this.game.snake.length - 1];
            this.game.ghostTrails.push({ x: tail.x, y: tail.y, ttl: 25 });
        }
        for (let i = this.game.ghostTrails.length - 1; i >= 0; i--) {
            this.game.ghostTrails[i].ttl--;
            if (this.game.ghostTrails[i].ttl <= 0) this.game.ghostTrails.splice(i, 1);
        }
        
        this.game.snake.unshift(head);
        
        // Подарок
        if (this.game.gift && head.x === this.game.gift.x && head.y === this.game.gift.y) {
            playSound("giftEat", this.game.soundEnabled);
            this.game.score += 50;
            this.game.particleSystem.addExplosion(head.x, head.y, "#ffd700", 12);
            addFloatingScore(this.game.floatingScores, head.x, head.y, "+50", this.game.currentLang);
            this.game.gift = null;
            checkScoreTasks(this.game.score, tasks, (id, obj) => completeTask(id, obj, (t) => playSound(t, this.game.soundEnabled), () => this.game.spawnGift()), (id, ach) => unlockAchievement(id, ach), achievements);
            this.game.updateHUD();
        }
        
        // Сбор монет (режим 8)
        const coinValue = this.game.specialModes.collectCoin(head);
        if (coinValue > 0) {
            this.game.score += coinValue;
            this.game.particleSystem.addExplosion(head.x, head.y, "#ffd700", 6);
            addFloatingScore(this.game.floatingScores, head.x, head.y, `+${coinValue}`, this.game.currentLang);
            this.game.updateHUD();
        }
        
        // Телепортация (режим 9) - проверяем до еды
        const teleported = this.game.specialModes.teleportIfNeeded(head);
        if (teleported) {
            this.game.particleSystem.addTeleportParticles(head.x, head.y);
            head.x = teleported.x;
            head.y = teleported.y;
            this.game.snake[0] = head;
            // После телепортации проверяем новую позицию на сбор монет/подарка
            if (this.game.gift && head.x === this.game.gift.x && head.y === this.game.gift.y) {
                playSound("giftEat", this.game.soundEnabled);
                this.game.score += 50;
                this.game.particleSystem.addExplosion(head.x, head.y, "#ffd700", 12);
                addFloatingScore(this.game.floatingScores, head.x, head.y, "+50", this.game.currentLang);
                this.game.gift = null;
                this.game.updateHUD();
            }
            const postTeleportCoin = this.game.specialModes.collectCoin(head);
            if (postTeleportCoin > 0) {
                this.game.score += postTeleportCoin;
                this.game.particleSystem.addExplosion(head.x, head.y, "#ffd700", 6);
                addFloatingScore(this.game.floatingScores, head.x, head.y, `+${postTeleportCoin}`, this.game.currentLang);
                this.game.updateHUD();
            }
        }
        
        // Еда
        if (this.game.currentModeIdx !== 8 && head.x === this.game.food.x && head.y === this.game.food.y) {
            const speed = this.game.isTurboActive ? this.game.speeds[2] : this.game.speeds[this.game.currentSpeedMode];
            let partColor = "#ff4d4d";
            if (this.game.foodType === "BIG") partColor = "#ffb900";
            else if (this.game.foodType === "SHRINK") partColor = "#1e88e5";
            else if (this.game.foodType === "TURBO") partColor = "#ba68c8";
            else if (this.game.foodType === "SHIELD") partColor = "#1e88e5";
            this.game.particleSystem.addExplosion(head.x, head.y, partColor, 10);
            this.game.foodLogic.processFoodEaten(head, speed);
        } else {
            this.game.snake.pop();
        }
    }
    
    moveFoodInRushMode() {
        if (this.game.currentModeIdx !== 7) return;
        this.game.foodMoveTimer -= this.game.isTurboActive ? this.game.speeds[2] : this.game.speeds[this.game.currentSpeedMode];
        if (this.game.foodMoveTimer <= 0) {
            playSound("foodMove", this.game.soundEnabled);
            let validPositions = [];
            for (let x = 0; x < this.game.tileCount; x++) {
                for (let y = 0; y < this.game.tileCount; y++) {
                    let isOccupied = this.game.snake.some(p => p.x === x && p.y === y) ||
                                     this.game.obstacles.some(o => o.x === x && o.y === y) ||
                                     this.game.ghostTrails.some(g => g.x === x && g.y === y) ||
                                     (this.game.gift && this.game.gift.x === x && this.game.gift.y === y) ||
                                     (this.game.aiOpponent && this.game.aiOpponent.snake && this.game.aiOpponent.snake.some(p => p.x === x && p.y === y));
                    if (!isOccupied) validPositions.push({x, y});
                }
            }
            if (validPositions.length > 0) {
                this.game.food = validPositions[Math.floor(Math.random() * validPositions.length)];
                addFloatingScore(this.game.floatingScores, this.game.food.x, this.game.food.y, "MOVED!", this.game.currentLang);
            }
            this.game.foodMoveTimer = this.game.foodMoveInterval;
        }
    }
    
    updateTimeMode() {
        if (this.game.currentModeIdx !== 6) return;
        if (this.game.isPaused) return;
        const now = Date.now();
        if (!this.game.lastTimeUpdate) {
            this.game.lastTimeUpdate = now;
            this.timeAccumulator = 0;
            return;
        }
        let delta = now - this.game.lastTimeUpdate;
        if (delta <= 0) return;
        this.timeAccumulator += delta;
        this.game.lastTimeUpdate = now;
        if (this.timeAccumulator >= 1000) {
            let secondsToDecrease = Math.floor(this.timeAccumulator / 1000);
            if (secondsToDecrease > 0) {
                this.game.timeRemaining -= secondsToDecrease;
                this.timeAccumulator -= secondsToDecrease * 1000;
                if (this.game.timeRemaining < 0) this.game.timeRemaining = 0;
                if (this.game.timeRemaining > 99) this.game.timeRemaining = 99;
                if (this.game.timeRemaining <= 10 && this.game.timeRemaining > 0) this.game.timeWarningFlash = !this.game.timeWarningFlash;
                this.game.updateHUD();
                if (this.game.timeRemaining <= 0) this.game.endGame();
            }
        }
    }
}