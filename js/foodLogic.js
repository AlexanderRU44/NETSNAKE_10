import { playSound, speeds, maxBigFoodTime, maxShrinkTime, maxTurboTime, addFloatingScore } from './utils.js';
import { completeTask, checkScoreTasks } from './tasks.js';
import { unlockAchievement } from './achievements.js';
import { achievements } from './achievements.js';
import { tasks } from './tasks.js';

export class FoodLogic {
    constructor(game) {
        this.game = game;
    }

    generateFood() {
        const maxAttempts = 100;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.floor(Math.random() * this.game.tileCount);
            const y = Math.floor(Math.random() * this.game.tileCount);
            
            let occupied = false;
            
            // Проверка змейки
            for (let i = 0; i < this.game.snake.length; i++) {
                if (this.game.snake[i].x === x && this.game.snake[i].y === y) {
                    occupied = true;
                    break;
                }
            }
            
            // Проверка камней
            if (!occupied && this.game.obstacles.length) {
                for (let i = 0; i < this.game.obstacles.length; i++) {
                    if (this.game.obstacles[i].x === x && this.game.obstacles[i].y === y) {
                        occupied = true;
                        break;
                    }
                }
            }
            
            // Проверка призрачных следов
            if (!occupied && this.game.ghostTrails.length) {
                for (let i = 0; i < this.game.ghostTrails.length; i++) {
                    if (this.game.ghostTrails[i].x === x && this.game.ghostTrails[i].y === y) {
                        occupied = true;
                        break;
                    }
                }
            }
            
            // Проверка подарка
            if (!occupied && this.game.gift && this.game.gift.x === x && this.game.gift.y === y) {
                occupied = true;
            }
            
            // Проверка AI соперника
            if (!occupied && this.game.aiOpponent && this.game.aiOpponent.snake) {
                for (let i = 0; i < this.game.aiOpponent.snake.length; i++) {
                    if (this.game.aiOpponent.snake[i].x === x && this.game.aiOpponent.snake[i].y === y) {
                        occupied = true;
                        break;
                    }
                }
            }
            
            if (!occupied) {
                this.game.food = { x, y };
                
                if (this.game.currentModeIdx === 7) {
                    this.game.foodMoveTimer = this.game.foodMoveInterval;
                }
                
                if (!this.game.isTurboActive) {
                    this.setRandomFoodType();
                } else {
                    this.game.foodType = "REGULAR";
                }
                return;
            }
        }
        
        if (!this.game.aiMode) this.game.endGame();
    }

    setRandomFoodType() {
        const rand = Math.random();
        if (rand < 0.05 && !this.game.blueFoodEaten) {
            this.game.foodType = "SHRINK";
            this.game.bonusTimer = maxShrinkTime;
        } else if (rand < 0.10) {
            this.game.foodType = "TURBO";
            this.game.bonusTimer = maxTurboTime;
        } else if (rand < 0.20 && !this.game.goldFoodEaten) {
            this.game.foodType = "BIG";
            this.game.bonusTimer = maxBigFoodTime;
        } else {
            this.game.foodType = "REGULAR";
        }
    }

    processFoodEaten(h, activeSpeed) {
        // TIME MODE (индекс 6) - добавляем 5 секунд за еду
        if (this.game.currentModeIdx === 6 && this.game.timeRemaining > 0) {
            this.game.timeRemaining += 5;
            if (this.game.timeRemaining > 99) this.game.timeRemaining = 99;
            playSound("timeBonus", this.game.soundEnabled);
            this.game.updateHUD();
        }
        
        // RUSH MODE (индекс 7) - добавляем 3 секунды за еду
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
        }
        
        checkScoreTasks(this.game.score, tasks, (id, tasksObj) => completeTask(id, tasksObj, 
            (type) => playSound(type, this.game.soundEnabled), () => this.game.spawnGift()), 
            (id, ach) => unlockAchievement(id, ach), achievements);
        
        if (this.game.foodType !== "TURBO") {
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
        addFloatingScore(this.game.floatingScores, h.x, h.y, `+${gain}`);
        this.game.regularApplesStreak++;
        if (this.game.regularApplesStreak >= 15) {
            unlockAchievement("vegetarian", achievements);
        }
    }

    processBigFood(h) {
        playSound("bigEat", this.game.soundEnabled);
        this.game.score += 10;
        addFloatingScore(this.game.floatingScores, h.x, h.y, "+10");
        this.game.goldFoodEaten = true;
        completeTask("goldFood", tasks, (type) => playSound(type, this.game.soundEnabled), () => this.game.spawnGift());
        this.game.regularApplesStreak = 0;
    }

    processShrinkFood(h) {
        playSound("shrinkEat", this.game.soundEnabled);
        this.game.blueFoodEaten = true;
        completeTask("blueFood", tasks, (type) => playSound(type, this.game.soundEnabled), () => this.game.spawnGift());
        this.game.regularApplesStreak = 0;
        if (this.game.snake.length === 3) {
            unlockAchievement("dietMode", achievements);
        }
        let newLength = Math.max(1, Math.floor(this.game.snake.length / 2));
        while (this.game.snake.length > newLength) this.game.snake.pop();
        addFloatingScore(this.game.floatingScores, h.x, h.y, "SHRINK");
    }

    processTurboFood() {
        playSound("turboEat", this.game.soundEnabled);
        this.game.isTurboActive = true;
        this.game.bonusTimer = maxTurboTime;
        addFloatingScore(this.game.floatingScores, this.game.snake[0].x, this.game.snake[0].y, "TURBO!");
        unlockAchievement("energyDrink", achievements);
        this.game.regularApplesStreak = 0;
        this.game.updateTicker();
    }
}