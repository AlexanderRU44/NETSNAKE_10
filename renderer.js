// obstacleManager.js
export class ObstacleManager {
    constructor(game) {
        this.game = game;
    }

    generateObstacles() {
        this.game.obstacles = [];
        this.game.flashingObstacleIdx = -1;
        if (this.game.currentModeIdx !== 2 && this.game.currentModeIdx !== 4) return;
        while (this.game.obstacles.length < 8) {
            let obsX = Math.floor(Math.random() * this.game.tileCount);
            let obsY = Math.floor(Math.random() * this.game.tileCount);
            let distance = Math.abs(obsX - this.game.snake[0].x) + Math.abs(obsY - this.game.snake[0].y);
            let isOnFood = (this.game.food && obsX === this.game.food.x && obsY === this.game.food.y);
            let isOnSnake = this.game.snake.some(part => part.x === obsX && part.y === obsY);
            let isDuplicate = this.game.obstacles.some(o => o.x === obsX && o.y === obsY);
            if (distance > 3 && !isOnFood && !isOnSnake && !isDuplicate) {
                this.game.obstacles.push({x: obsX, y: obsY});
            }
        }
    }

    moveOneObstacle() {
        if (this.game.obstacles.length === 0) return;
        let idx = Math.floor(Math.random() * this.game.obstacles.length);
        let validPositions = [];
        for (let x = 0; x < this.game.tileCount; x++) {
            for (let y = 0; y < this.game.tileCount; y++) {
                let isOccupied = this.game.snake.some(part => part.x === x && part.y === y) || 
                                 this.game.obstacles.some(o => o.x === x && o.y === y) ||
                                 this.game.ghostTrails.some(g => g.x === x && g.y === y) ||
                                 (this.game.food && this.game.food.x === x && this.game.food.y === y) || 
                                 (this.game.gift && this.game.gift.x === x && this.game.gift.y === y) ||
                                 (this.game.aiOpponent && this.game.aiOpponent.snake && this.game.aiOpponent.snake.some(part => part.x === x && part.y === y));
                // Дополнительная проверка - не перемещать камень слишком близко к голове змеи
                const isTooClose = Math.abs(x - this.game.snake[0].x) + Math.abs(y - this.game.snake[0].y) <= 2;
                if (!isOccupied && !isTooClose) {
                    validPositions.push({x, y});
                }
            }
        }
        if (validPositions.length > 0) {
            this.game.obstacles[idx] = validPositions[Math.floor(Math.random() * validPositions.length)];
        }
    }

    spawnGift() {
        let validPositions = [];
        for (let x = 0; x < this.game.tileCount; x++) {
            for (let y = 0; y < this.game.tileCount; y++) {
                let isOccupied = this.game.snake.some(part => part.x === x && part.y === y) || 
                                 this.game.obstacles.some(o => o.x === x && o.y === y) ||
                                 this.game.ghostTrails.some(g => g.x === x && g.y === y) ||
                                 (this.game.food && this.game.food.x === x && this.game.food.y === y) || 
                                 (this.game.gift && this.game.gift.x === x && this.game.gift.y === y) ||
                                 (this.game.aiOpponent && this.game.aiOpponent.snake && this.game.aiOpponent.snake.some(part => part.x === x && part.y === y));
                if (!isOccupied) validPositions.push({x, y});
            }
        }
        if (validPositions.length > 0) {
            this.game.gift = validPositions[Math.floor(Math.random() * validPositions.length)];
        }
    }
}