import { unlockAchievement } from './achievements.js';
import { achievements } from './achievements.js';
import { playSound } from './utils.js';

export class CollisionChecker {
    constructor(game) {
        this.game = game;
    }

    checkCollision() {
        if (this.game.aiMode) return;
        
        const h = this.game.snake[0];
        const headX = h.x;
        const headY = h.y;
        
        // Портал не убивает (режим 9) - но нужно продолжить проверку других коллизий
        let isOnPortal = false;
        if (this.game.currentModeIdx === 9 && this.game.specialModes.isPortalCell(headX, headY)) {
            isOnPortal = true;
        }
        
        // Расстояние до золотого яблока (для достижения greed)
        if (this.game.foodType === "BIG") {
            const distToGold = Math.abs(headX - this.game.food.x) + Math.abs(headY - this.game.food.y);
            this.game.goldDistanceBeforeDeath = distToGold;
        } else {
            this.game.goldDistanceBeforeDeath = null;
        }
        
        // Стены (только для режима 1)
        if (this.game.currentModeIdx === 1 && (headX < 0 || headX >= this.game.tileCount || headY < 0 || headY >= this.game.tileCount)) {
            this.game.endGame();
            return true;
        }
        
        // Столкновение с собой
        for (let i = 1; i < this.game.snake.length; i++) {
            if (headX === this.game.snake[i].x && headY === this.game.snake[i].y) {
                this.game.endGame();
                return true;
            }
        }
        
        // Камни (режимы 2 и 4)
        if ((this.game.currentModeIdx === 2 || this.game.currentModeIdx === 4) && this.game.obstacles.length) {
            for (let obs of this.game.obstacles) {
                if (obs.x === headX && obs.y === headY) {
                    this.game.endGame();
                    return true;
                }
            }
        }
        
        // Призрачные следы (режим 3)
        if (this.game.currentModeIdx === 3 && this.game.ghostTrails.length) {
            for (let gt of this.game.ghostTrails) {
                if (gt.x === headX && gt.y === headY) {
                    this.game.endGame();
                    return true;
                }
            }
        }
        
        // AI соперник (режим 5)
        if (this.game.currentModeIdx === 5 && this.game.aiOpponent) {
            for (let seg of this.game.aiOpponent.snake) {
                if (seg.x === headX && seg.y === headY) {
                    this.game.endGame();
                    return true;
                }
            }
        }
        
        // Если на портале и не было других коллизий - безопасно
        if (isOnPortal) {
            return false;
        }
        
        return false;
    }
}