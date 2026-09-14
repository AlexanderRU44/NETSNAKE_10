export class ObstacleManager {
    constructor(game) {
        this.game = game;
    }

    generateObstacles() {
        this.game.obstacles = [];
        this.game.flashingObstacleIdx = -1;

        // Режимы 2 и 4 — камни
        if (this.game.currentModeIdx === 2 || this.game.currentModeIdx === 4) {
            this.generateStones(8);
        }

        // Режим 10 — лабиринт
        if (this.game.currentModeIdx === 10) {
            this.generateMaze();
        }
    }

    generateStones(count) {
        let attempts = 0;
        while (this.game.obstacles.length < count && attempts < 500) {
            const obsX = Math.floor(Math.random() * this.game.tileCount);
            const obsY = Math.floor(Math.random() * this.game.tileCount);
            const distance = Math.abs(obsX - this.game.snake[0].x) + Math.abs(obsY - this.game.snake[0].y);
            const isOnFood = (this.game.food && obsX === this.game.food.x && obsY === this.game.food.y);
            const isOnSnake = this.game.snake.some(part => part.x === obsX && part.y === obsY);
            const isDuplicate = this.game.obstacles.some(o => o.x === obsX && o.y === obsY);
            if (distance > 3 && !isOnFood && !isOnSnake && !isDuplicate) {
                this.game.obstacles.push({ x: obsX, y: obsY });
            }
            attempts++;
        }
    }

    // === ЛАБИРИНТ ===
    generateMaze() {
        const tileCount = this.game.tileCount; // обычно 20
        const cells = Array.from({ length: tileCount }, () => new Array(tileCount).fill(false));

        // Рекурсивный лабиринт (алгоритм DFS)
        const stack = [{ x: 1, y: 1 }];
        cells[1][1] = true;
        const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]];

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = [];
            for (const [dx, dy] of dirs) {
                const nx = current.x + dx;
                const ny = current.y + dy;
                if (nx > 0 && nx < tileCount - 1 && ny > 0 && ny < tileCount - 1 && !cells[nx][ny]) {
                    neighbors.push({ x: nx, y: ny, px: current.x + dx / 2, py: current.y + dy / 2 });
                }
            }
            if (neighbors.length === 0) {
                stack.pop();
            } else {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                cells[next.x][next.y] = true;
                cells[next.px][next.py] = true;
                stack.push({ x: next.x, y: next.y });
            }
        }

        // Делаем стены вокруг всех непроходимых клеток
        for (let x = 0; x < tileCount; x++) {
            for (let y = 0; y < tileCount; y++) {
                if (!cells[x][y]) {
                    // Оставляем только внутренние стены (не затираем старт змейки)
                    const isSnakeArea = Math.abs(x - 10) + Math.abs(y - 10) < 4;
                    if (!isSnakeArea) {
                        this.game.obstacles.push({ x, y });
                    }
                }
            }
        }

        // Освобождаем клетку для еды (если еда попала на стену)
        if (this.game.food && this.game.obstacles.some(o => o.x === this.game.food.x && o.y === this.game.food.y)) {
            this.game.obstacles = this.game.obstacles.filter(o => !(o.x === this.game.food.x && o.y === this.game.food.y));
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
                const isTooClose = Math.abs(x - this.game.snake[0].x) + Math.abs(y - this.game.snake[0].y) <= 2;
                if (!isOccupied && !isTooClose) {
                    validPositions.push({ x, y });
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
                if (!isOccupied) validPositions.push({ x, y });
            }
        }
        if (validPositions.length > 0) {
            this.game.gift = validPositions[Math.floor(Math.random() * validPositions.length)];
        }
    }
}