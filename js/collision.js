import { unlockAchievement } from './achievements.js';
import { achievements } from './achievements.js';

export class CollisionChecker {
    constructor(game) {
        this.game = game;
    }

    checkCollision() {
        if (this.game.aiMode) return;
        
        const h = this.game.snake[0];
        const headX = h.x;
        const headY = h.y;
        
        // Проверка границ для режима СТЕНЫ (индекс 1)
        if (this.game.currentModeIdx === 1 && (headX < 0 || headX >= this.game.tileCount || headY < 0 || headY >= this.game.tileCount)) {
            this.game.endGame();
            return true;
        }
        
        // Проверка столкновения с собой
        for (let i = 1; i < this.game.snake.length; i++) {
            if (headX === this.game.snake[i].x && headY === this.game.snake[i].y) {
                this.game.endGame();
                return true;
            }
        }
        
        // Проверка столкновения с камнями для режимов 2 и 4
        if ((this.game.currentModeIdx === 2 || this.game.currentModeIdx === 4) && this.game.obstacles.length) {
            for (let i = 0; i < this.game.obstacles.length; i++) {
                if (this.game.obstacles[i].x === headX && this.game.obstacles[i].y === headY) {
                    this.game.endGame();
                    return true;
                }
            }
        }
        
        // Проверка призрачных следов
        if (this.game.ghostTrails.length) {
            for (let i = 0; i < this.game.ghostTrails.length; i++) {
                if (this.game.ghostTrails[i].x === headX && this.game.ghostTrails[i].y === headY) {
                    this.game.endGame();
                    return true;
                }
            }
        }
        
        // Проверка столкновения с AI соперником для режима 5
        if (this.game.currentModeIdx === 5 && this.game.aiOpponent) {
            for (let i = 0; i < this.game.aiOpponent.snake.length; i++) {
                if (this.game.aiOpponent.snake[i].x === headX && this.game.aiOpponent.snake[i].y === headY) {
                    this.game.endGame();
                    return true;
                }
            }
        }
        
        // Проверка для достижения "ЖАДНОСТЬ" (шаг до золотого яблока)
        if (this.game.foodType === "BIG") {
            this.checkGreedAchievement(headX, headY);
        }
        
        return false;
    }

    checkGreedAchievement(headX, headY) {
        const distToGold = Math.abs(headX - this.game.food.x) + Math.abs(headY - this.game.food.y);
        if (distToGold === 1) {
            if (this.game.currentModeIdx === 1 && (headX + this.game.dx < 0 || headX + this.game.dx >= this.game.tileCount || 
                headY + this.game.dy < 0 || headY + this.game.dy >= this.game.tileCount)) {
                unlockAchievement("greed", achievements);
            }
            if ((this.game.currentModeIdx === 2 || this.game.currentModeIdx === 4) && 
                this.game.obstacles.some(obs => obs.x === (headX + this.game.dx) && obs.y === (headY + this.game.dy))) {
                unlockAchievement("greed", achievements);
            }
            for (let i = 1; i < this.game.snake.length; i++) {
                if ((headX + this.game.dx) === this.game.snake[i].x && (headY + this.game.dy) === this.game.snake[i].y) {
                    unlockAchievement("greed", achievements);
                }
            }
        }
    }
}