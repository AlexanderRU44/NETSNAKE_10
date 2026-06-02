// multiplayerGame.js
import { playSound } from '../utils.js';

export class MultiplayerGame {
    constructor(game, peerManager) {
        this.game = game;
        this.peerManager = peerManager;
        this.isHost = false;
        this.gameActive = false;
        this.mySnake = [];
        this.opponentSnake = [];
        this.myScore = 0;
        this.opponentScore = 0;
        this.food = null;
        this.tileCount = 20;
        this.myDirection = { dx: 1, dy: 0 };
        this.nextDirection = { dx: 1, dy: 0 };
        this.gameLoopInterval = null;
    }

    init(isHost) {
        console.log("MultiplayerGame.init, isHost:", isHost);
        this.isHost = isHost;
        this.setupEventListeners();
        this.initGameState();
    }

    setupEventListeners() {
        this.peerManager.onDataReceived = (data) => {
            console.log("Data received:", data.type);
            
            if (data.type === 'gameState') {
                this.opponentSnake = data.snake;
                this.opponentScore = data.score;
                this.food = data.food;
                this.game.updateMultiplayerHUD(this.myScore, this.opponentScore);
            } 
            else if (data.type === 'gameEnd') {
                this.game.showMultiplayerMessage(data.message);
                this.gameActive = false;
                if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
            }
        };
        
        this.peerManager.onConnectionOpen = (isHostFromServer) => {
            console.log("onConnectionOpen CALLED! Starting game now!");
            this.startGame();
        };
        
        this.peerManager.onOpponentDisconnect = () => {
            console.log("Opponent disconnected!");
            this.game.showMultiplayerMessage("Opponent disconnected!");
            this.gameActive = false;
            if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        };
    }

    initGameState() {
        console.log("initGameState, isHost:", this.isHost);
        this.tileCount = 20;
        
        if (this.isHost) {
            this.mySnake = [
                { x: 8, y: 10 },
                { x: 7, y: 10 },
                { x: 6, y: 10 }
            ];
            this.opponentSnake = [
                { x: 12, y: 10 },
                { x: 13, y: 10 },
                { x: 14, y: 10 }
            ];
            this.myDirection = { dx: 1, dy: 0 };
            this.nextDirection = { dx: 1, dy: 0 };
        } else {
            this.mySnake = [
                { x: 12, y: 10 },
                { x: 13, y: 10 },
                { x: 14, y: 10 }
            ];
            this.opponentSnake = [
                { x: 8, y: 10 },
                { x: 7, y: 10 },
                { x: 6, y: 10 }
            ];
            this.myDirection = { dx: -1, dy: 0 };
            this.nextDirection = { dx: -1, dy: 0 };
        }
        
        this.myScore = 0;
        this.opponentScore = 0;
        this.generateFood();
        this.game.updateMultiplayerHUD(0, 0);
    }

    generateFood() {
        const maxAttempts = 100;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
            
            let onSnake = false;
            for (const seg of this.mySnake) {
                if (seg.x === food.x && seg.y === food.y) onSnake = true;
            }
            for (const seg of this.opponentSnake) {
                if (seg.x === food.x && seg.y === food.y) onSnake = true;
            }
            
            if (!onSnake) {
                this.food = food;
                return;
            }
        }
    }

    startGame() {
        if (this.gameActive) return;
        
        console.log("START GAME EXECUTED!");
        this.gameActive = true;
        
        // Отправляем начальное состояние
        this.sendGameState();
        
        // Запускаем игровой цикл
        if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = setInterval(() => {
            this.update();
        }, 150);
    }

    update() {
        if (!this.gameActive) return;
        
        this.myDirection = { ...this.nextDirection };
        
        const head = this.mySnake[0];
        const newHead = {
            x: head.x + this.myDirection.dx,
            y: head.y + this.myDirection.dy
        };
        
        newHead.x = (newHead.x + this.tileCount) % this.tileCount;
        newHead.y = (newHead.y + this.tileCount) % this.tileCount;
        
        this.mySnake.unshift(newHead);
        
        const ateFood = (newHead.x === this.food.x && newHead.y === this.food.y);
        
        if (ateFood) {
            this.myScore++;
            playSound("eat", this.game.soundEnabled);
            this.generateFood();
            this.game.updateMultiplayerHUD(this.myScore, this.opponentScore);
        } else {
            this.mySnake.pop();
        }
        
        if (this.checkCollisions()) {
            this.endGame('You crashed!');
            return;
        }
        
        this.sendGameState();
    }

    checkCollisions() {
        const head = this.mySnake[0];
        
        for (let i = 1; i < this.mySnake.length; i++) {
            if (head.x === this.mySnake[i].x && head.y === this.mySnake[i].y) return true;
        }
        
        for (const seg of this.opponentSnake) {
            if (head.x === seg.x && head.y === seg.y) return true;
        }
        
        return false;
    }

    sendGameState() {
        if (!this.peerManager.isConnected()) return;
        
        this.peerManager.sendMessage({
            type: 'gameState',
            snake: this.mySnake,
            score: this.myScore,
            food: this.food
        });
    }

    sendDirection(dx, dy) {
        if (!this.gameActive) return;
        if ((dx === -this.myDirection.dx && dy === -this.myDirection.dy)) return;
        this.nextDirection = { dx, dy };
    }

    endGame(message) {
        if (!this.gameActive) return;
        this.gameActive = false;
        if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        this.peerManager.sendMessage({ type: 'gameEnd', message: message });
        this.game.showMultiplayerMessage(message);
        playSound("die", this.game.soundEnabled);
    }

    draw(ctx, tileSize) {
        if (!this.food) return;
        
        ctx.fillStyle = "#ff4d4d";
        ctx.fillRect(this.food.x * tileSize, this.food.y * tileSize, tileSize - 1, tileSize - 1);
        
        for (let i = 0; i < this.mySnake.length; i++) {
            const seg = this.mySnake[i];
            ctx.fillStyle = i === 0 ? "#38ff38" : "#2d8a2d";
            ctx.fillRect(seg.x * tileSize, seg.y * tileSize, tileSize - 1, tileSize - 1);
        }
        
        for (let i = 0; i < this.opponentSnake.length; i++) {
            const seg = this.opponentSnake[i];
            ctx.fillStyle = i === 0 ? "#ff6b6b" : "#b30000";
            ctx.fillRect(seg.x * tileSize, seg.y * tileSize, tileSize - 1, tileSize - 1);
        }
    }

    cleanup() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
        this.gameActive = false;
    }
}
