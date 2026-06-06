import { speeds } from './utils.js';
import { makeAIMove } from './ai.js';
import { makeAIMove as makeAIOpponentMove } from './aiOpponent.js';
import { playSound } from './utils.js';

export class AILogic {
    constructor(game) {
        this.game = game;
    }

    makeAIPlayerMove() {
        const move = makeAIMove(this.game.snake, this.game.gift, this.game.food, 
            this.game.tileCount, this.game.obstacles, this.game.ghostTrails, this.game.currentModeIdx);
        if (move) {
            if (move === "UP") { this.game.nextDx = 0; this.game.nextDy = -1; }
            if (move === "DOWN") { this.game.nextDx = 0; this.game.nextDy = 1; }
            if (move === "LEFT") { this.game.nextDx = -1; this.game.nextDy = 0; }
            if (move === "RIGHT") { this.game.nextDx = 1; this.game.nextDy = 0; }
        }
    }

    initAIOpponent() {
        let startX, startY;
        let attempts = 0;
        do {
            startX = Math.floor(Math.random() * (this.game.tileCount - 5)) + 2;
            startY = Math.floor(Math.random() * (this.game.tileCount - 5)) + 2;
            attempts++;
            if (attempts > 50) break;
        } while (Math.abs(startX - this.game.snake[0].x) < 4 && Math.abs(startY - this.game.snake[0].y) < 4);
        
        this.game.aiOpponent = {
            snake: [{x: startX, y: startY}],
            dx: 1,
            dy: 0,
            score: 0
        };
        this.game.aiOpponentScore = 0;
        
        for (let i = 1; i < 3; i++) {
            this.game.aiOpponent.snake.push({x: startX - i, y: startY});
        }
    }

    moveAIOpponent() {
        if (!this.game.aiOpponent) return;
        
        const move = makeAIOpponentMove(this.game.aiOpponent.snake, this.game.food, 
            this.game.tileCount, this.game.obstacles, this.game.ghostTrails, this.game.snake);
        if (move) {
            if (move === "UP") { this.game.aiOpponent.dx = 0; this.game.aiOpponent.dy = -1; }
            if (move === "DOWN") { this.game.aiOpponent.dx = 0; this.game.aiOpponent.dy = 1; }
            if (move === "LEFT") { this.game.aiOpponent.dx = -1; this.game.aiOpponent.dy = 0; }
            if (move === "RIGHT") { this.game.aiOpponent.dx = 1; this.game.aiOpponent.dy = 0; }
        }
        
        const head = this.game.aiOpponent.snake[0];
        let newHead = { x: head.x + this.game.aiOpponent.dx, y: head.y + this.game.aiOpponent.dy };
        
        if (this.game.currentModeIdx === 1) {
            if (newHead.x < 0 || newHead.x >= this.game.tileCount || newHead.y < 0 || newHead.y >= this.game.tileCount) {
                this.game.endGame(true);
                return;
            }
        } else {
            if (newHead.x < 0) newHead.x = this.game.tileCount - 1;
            if (newHead.x >= this.game.tileCount) newHead.x = 0;
            if (newHead.y < 0) newHead.y = this.game.tileCount - 1;
            if (newHead.y >= this.game.tileCount) newHead.y = 0;
        }
        
        const ateFood = (newHead.x === this.game.food.x && newHead.y === this.game.food.y);
        
        this.game.aiOpponent.snake.unshift(newHead);
        if (!ateFood) {
            this.game.aiOpponent.snake.pop();
        } else {
            this.game.aiOpponent.score++;
            this.game.aiOpponentScore = this.game.aiOpponent.score;
            this.game.generateFood();
            playSound("eat", this.game.soundEnabled);
            this.game.updateHUD();
        }
        
        // Проверка столкновения AI с собой
        for (let i = 1; i < this.game.aiOpponent.snake.length; i++) {
            if (this.game.aiOpponent.snake[i].x === newHead.x && this.game.aiOpponent.snake[i].y === newHead.y) {
                this.game.endGame(true);
                return;
            }
        }
        
        // Проверка столкновения AI с игроком
        for (let i = 0; i < this.game.snake.length; i++) {
            if (this.game.snake[i].x === newHead.x && this.game.snake[i].y === newHead.y) {
                this.game.endGame(true);
                return;
            }
        }
        
        // Проверка столкновения AI с препятствиями
        if ((this.game.currentModeIdx === 2 || this.game.currentModeIdx === 4) && this.game.obstacles.length) {
            for (let i = 0; i < this.game.obstacles.length; i++) {
                if (this.game.obstacles[i].x === newHead.x && this.game.obstacles[i].y === newHead.y) {
                    this.game.endGame(true);
                    return;
                }
            }
        }
    }

    updateAIOpponentMoveTimer() {
        if (this.game.currentModeIdx === 5 && this.game.aiOpponent) {
            this.game.aiOpponentMoveTimer += this.game.isTurboActive ? speeds[2] : speeds[this.game.currentSpeedMode];
            if (this.game.aiOpponentMoveTimer >= this.game.aiOpponentMoveDelay) {
                this.moveAIOpponent();
                this.game.aiOpponentMoveTimer = 0;
            }
        }
    }
}