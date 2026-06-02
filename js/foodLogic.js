import { playSound, speeds, maxBigFoodTime, maxShrinkTime, maxTurboTime, addFloatingScore } from './utils.js';
import { completeTask, checkScoreTasks } from './tasks.js';
import { unlockAchievement } from './achievements.js';
import { achievements } from './achievements.js';
import { tasks } from './tasks.js';

export class FoodLogic {
    constructor(game) {
        this.game = game;
        this.shieldTimeout = null;
    }

    generateFood() {
        if (this.game.currentModeIdx === 8) return;
        
        const maxAttempts = 100;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.floor(Math.random() * this.game.tileCount);
            const y = Math.floor(Math.random() * this.game.tileCount);
            
            let occupied = false;
            for (let i = 0; i < this.game.snake.length; i++) {
                if (this.game.snake[i].x === x && this.game.snake[i].y === y) { occupied = true; break; }
            }
            if (!occupied && this.game.obstacles.length) {
                for (let i = 0; i < this.game.obstacles.length; i++) {
                    if (this.game.obstacles[i].x === x && this.game.obstacles[i].y === y) { occupied = true; break; }
                }
            }
            if (!occupied && this.game.ghostTrails.length) {
                for (let i = 0; i < this.game.ghostTrails.length; i++) {
                    if (this.game.ghostTrails[i].x === x && this.game.ghostTrails[i].y === y) { occupied = true; break; }
                }
            }
            if (!occupied && this.game.gift && this.game.gift.x === x && this.game.gift.y === y) occupied = true;
            if (!occupied && this.game.aiOpponent && this.game.aiOpponent.snake) {
                for (let i = 0; i < this.game.aiOpponent.snake.length; i++) {
                    if (this.game.aiOpponent.snake[i].x === x && this.game.aiOpponent.snake[i].y === y) { occupied = true; break; }
                }
            }
            if (!occupied) {
                this.game.food = { x, y };
                if (this.game.currentModeIdx === 7) this.game.foodMoveTimer = this.game.foodMoveInterval;
                if (!this.game.isTurboActive) this.setRandomFoodType();
                else this.game.foodType = "REGULAR";
                return;
            }
        }
        if (!this.game.aiMode) this.game.endGame();
    }

    setRandomFoodType() {
        const plannedType = this.game.screenEffects.getNewFoodType();
        if (plannedType === "SHRINK") {
            this.game.foodType = "SHRINK";
            this.game.bonusTimer = maxShrinkTime;
        } else if (plannedType === "TURBO") {
            this.game.foodType = "TURBO";
            this.game.bonusTimer = maxTurboTime;
        } else if (plannedType === "BIG") {
            this.game.foodType = "BIG";
            this.game.bonusTimer = maxBigFoodTime;
        } else if (plannedType === "SHIELD") {
            this.game.foodType = "SHIELD";
            this.game.bonusTimer = 0;
        } else {
            this.game.foodType = "REGULAR";
        }
    }

    processFoodEaten(h, activeSpeed) {
        if (this.game.currentModeIdx === 8) return;
        
        if (this.game.currentModeIdx === 6 && this.game.timeRemaining > 0) {
            this.game.timeRemaining += 5;
            if (this.game.timeRemaining > 99) this.game.timeRemaining = 99;
            playSound("timeBonus", this.game.soundEnabled);
            this.game.updateHUD();
        }
        
        if (this.game.currentModeIdx === 7 && this.game.timeRemaining > 0) {
            this.game.timeRemaining += 3;
            if (this.game.timeRemaining > 99) this.game.timeRemaining = 99;
            playSound("timeBonus", this.game.soundEnabled);
            this.game.updateHUD();
        }
        
        if (this.game.foodType !== "REGULAR" && this.game.bonusTimer > 0 && this.game.bonusTimer < (activeSpeed * 5)) {
            unlockAchievement("hawkTactics", achievements);
        }
        
        if (this.game.foodType === "REGULAR") {
            this.processRegularFood(h);
        } else if (this.game.foodType === "BIG") {
            this.processBigFood(h);
        } else if (this.game.foodType === "SHRINK") {
            this.processShrinkFood(h);
        } else if (this.game.foodType === "TURBO") {
            this.processTurboFood();
        } else if (this.game.foodType === "SHIELD") {
            this.processShieldFood(h);
        }
        
        checkScoreTasks(this.game.score, tasks, (id, tasksObj) => completeTask(id, tasksObj, 
            (type) => playSound(type, this.game.soundEnabled), () => this.game.spawnGift()), 
            (id, ach) => unlockAchievement(id, ach), achievements);
        
        if (this.game.foodType !== "TURBO" && this.game.foodType !== "SHIELD") {
            this.game.foodType = "REGULAR";
            if (!this.game.isTurboActive) this.game.timerContainer.style.visibility = "hidden";
        }
        this.game.updateHUD();
        this.generateFood();
    }

    processRegularFood(h) {
        playSound("eat", this.game.soundEnabled);
        let gain = this.game.isTurboActive ? 3 : 1;
        this.game.score += gain;
        this.game.particleSystem.addExplosion(h.x, h.y, "#ff4d4d", 6);
        addFloatingScore(this.game.floatingScores, h.x, h.y, `+${gain}`, this.game.currentLang);
        this.game.regularApplesStreak++;
        if (this.game.regularApplesStreak >= 15) unlockAchievement("vegetarian", achievements);
    }

    processBigFood(h) {
        playSound("bigEat", this.game.soundEnabled);
        this.game.score += 10;
        this.game.particleSystem.addExplosion(h.x, h.y, "#ffb900", 12);
        addFloatingScore(this.game.floatingScores, h.x, h.y, "+10", this.game.currentLang);
        this.game.goldFoodEaten = true;
        completeTask("goldFood", tasks, (type) => playSound(type, this.game.soundEnabled), () => this.game.spawnGift());
        this.game.regularApplesStreak = 0;
    }

    processShrinkFood(h) {
        playSound("shrinkEat", this.game.soundEnabled);
        this.game.blueFoodEaten = true;
        this.game.particleSystem.addExplosion(h.x, h.y, "#1e88e5", 8);
        completeTask("blueFood", tasks, (type) => playSound(type, this.game.soundEnabled), () => this.game.spawnGift());
        this.game.regularApplesStreak = 0;
        if (this.game.snake.length === 3) unlockAchievement("dietMode", achievements);
        let newLength = Math.max(1, Math.floor(this.game.snake.length / 2));
        while (this.game.snake.length > newLength) this.game.snake.pop();
        addFloatingScore(this.game.floatingScores, h.x, h.y, "SHRINK", this.game.currentLang);
    }

    processTurboFood() {
        playSound("turboEat", this.game.soundEnabled);
        const nowTime = maxTurboTime;
        if (this.game.isTurboActive) {
            this.game.turboRemainingTime = nowTime;
        } else {
            this.game.isTurboActive = true;
            this.game.turboRemainingTime = nowTime;
            this.game.updateTicker();
            this.game.timerContainer.style.visibility = "visible";
        }
        this.game.timerBar.style.width = "100%";
        this.game.particleSystem.addTurboParticles(this.game.snake[0].x, this.game.snake[0].y);
        addFloatingScore(this.game.floatingScores, this.game.snake[0].x, this.game.snake[0].y, "TURBO!", this.game.currentLang);
        unlockAchievement("energyDrink", achievements);
        this.game.regularApplesStreak = 0;
    }

    processShieldFood(h) {
        playSound("shield", this.game.soundEnabled);
        this.game.shieldActive = true;
        this.game.particleSystem.addExplosion(h.x, h.y, "#1e88e5", 10);
        addFloatingScore(this.game.floatingScores, h.x, h.y, "SHIELD", this.game.currentLang);
        this.game.regularApplesStreak = 0;
        
        // Очищаем предыдущий таймаут, если есть
        if (this.shieldTimeout) {
            clearTimeout(this.shieldTimeout);
            this.shieldTimeout = null;
        }
        
        // Автоматически снять щит через 10 секунд
        this.shieldTimeout = setTimeout(() => {
            // Проверяем, что игра ещё существует и щит активен
            if (this.game && this.game.shieldActive) {
                this.game.shieldActive = false;
                playSound("shieldBreak", this.game.soundEnabled);
            }
            this.shieldTimeout = null;
        }, 10000);
    }
    
    // Метод для принудительной очистки таймаута (вызывается при сбросе игры)
    clearShieldTimeout() {
        if (this.shieldTimeout) {
            clearTimeout(this.shieldTimeout);
            this.shieldTimeout = null;
        }
    }
}