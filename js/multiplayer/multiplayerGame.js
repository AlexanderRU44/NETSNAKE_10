// multiplayerGame.js - полная синхронизация
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
        this.lastUpdateTime = 0;
    }

    init(isHost) {
        this.isHost = isHost;
        this.setupEventListeners();
        this.initGameState();
    }

    setupEventListeners() {
        this.peerManager.onDataReceived = (data) => {
            console.log("Data received:", data.type);
            
            if (data.type === 'gameState') {
                // Обновляем состояние оппонента
                this.opponentSnake = data.snake;
                this.opponentScore = data.score;
                this.food = data.food;
                this.game.updateMultiplayerHUD(this.myScore, this.opponentScore);
            } 
            else if (data.type === 'direction') {
                // Обновляем направление оппонента (для плавности)
                // Можно не обрабатывать, т.к. змейка синхронизируется через gameState
            }
            else if (data.type === 'gameEnd') {
                this.game.showMultiplayerMessage(data.message);
                this.gameActive = false;
                if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
            }
        };
        
        this.peerManager.onConnectionOpen = () => {
            console.log("Connection opened! Starting game...");
            this.startGame();
        };
        
        this.peerManager.onOpponentDisconnect = () => {
            console.log("Opponent disconnected!");
            this.game.showMultiplayerMessage("Opponent disconnected!");
            this.gameActive = false;
            if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        };
        
        this.peerManager.onError = (error) => {
            console.error("Peer error:", error);
            this.game.showMultiplayerMessage("Connection error!");
            this.gameActive = false;
        };
    }

    initGameState() {
        this.tileCount = 20;
        
        if (this.isHost) {
            // Хост - змейка слева, движется вправо
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
            // Клиент - змейка справа, движется влево
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
        console.log("Starting game loop");
        this.gameActive = true;
        this.lastUpdateTime = Date.now();
        
        // Запускаем игровой цикл
        if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = setInterval(() => {
            this.update();
        }, 100); // 10 FPS
    }

    update() {
        if (!this.gameActive) return;
        
        // Применяем направление
        this.myDirection = { ...this.nextDirection };
        
        // Движение змейки
        const head = this.mySnake[0];
        const newHead = {
            x: head.x + this.myDirection.dx,
            y: head.y + this.myDirection.dy
        };
        
        // Телепортация через стены
        newHead.x = (newHead.x + this.tileCount) % this.tileCount;
        newHead.y = (newHead.y + this.tileCount) % this.tileCount;
        
        this.mySnake.unshift(newHead);
        
        // Проверка еды
        const ateFood = (newHead.x === this.food.x && newHead.y === this.food.y);
        
        if (ateFood) {
            this.myScore++;
            playSound("eat", this.game.soundEnabled);
            this.generateFood();
            this.game.updateMultiplayerHUD(this.myScore, this.opponentScore);
        } else {
            this.mySnake.pop();
        }
        
        // Проверка столкновений
        if (this.checkCollisions()) {
            this.endGame('You crashed! You lose!');
            return;
        }
        
        // Отправляем состояние оппоненту
        this.sendGameState();
    }

    checkCollisions() {
        const head = this.mySnake[0];
        
        // Столкновение с собой
        for (let i = 1; i < this.mySnake.length; i++) {
            if (head.x === this.mySnake[i].x && head.y === this.mySnake[i].y) {
                return true;
            }
        }
        
        // Столкновение со змейкой оппонента
        for (const seg of this.opponentSnake) {
            if (head.x === seg.x && head.y === seg.y) {
                return true;
            }
        }
        
        return false;
    }

    sendGameState() {
        if (!this.peerManager.isConnected()) return;
        
        this.peerManager.sendMessage({
            type: 'gameState',
            snake: this.mySnake,
            score: this.myScore,
            food: this.food,
            timestamp: Date.now()
        });
    }

    sendDirection(dx, dy) {
        if (!this.gameActive) return;
        
        // Нельзя развернуться на 180 градусов
        if ((dx === -this.myDirection.dx && dy === -this.myDirection.dy)) {
            return;
        }
        
        this.nextDirection = { dx, dy };
        
        // Отправляем направление оппоненту (опционально)
        this.peerManager.sendMessage({
            type: 'direction',
            dx: dx,
            dy: dy
        });
    }

    endGame(message) {
        if (!this.gameActive) return;
        
        console.log("Game ended:", message);
        this.gameActive = false;
        
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
        
        // Отправляем сообщение оппоненту
        this.peerManager.sendMessage({
            type: 'gameEnd',
            message: message
        });
        
        // Показываем сообщение
        this.game.showMultiplayerMessage(message);
        playSound("die", this.game.soundEnabled);
    }

    draw(ctx, tileSize) {
        if (!this.food) return;
        
        // Рисуем еду
        ctx.fillStyle = "#ff4d4d";
        ctx.fillRect(this.food.x * tileSize, this.food.y * tileSize, tileSize - 1, tileSize - 1);
        
        // Рисуем змейку игрока (зелёная)
        for (let i = 0; i < this.mySnake.length; i++) {
            const seg = this.mySnake[i];
            ctx.fillStyle = i === 0 ? "#38ff38" : "#2d8a2d";
            ctx.fillRect(seg.x * tileSize, seg.y * tileSize, tileSize - 1, tileSize - 1);
            
            // Глаза для головы
            if (i === 0) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(seg.x * tileSize + 4, seg.y * tileSize + 4, 4, 4);
                ctx.fillRect(seg.x * tileSize + 12, seg.y * tileSize + 4, 4, 4);
                ctx.fillStyle = "#000000";
                ctx.fillRect(seg.x * tileSize + 5, seg.y * tileSize + 5, 2, 2);
                ctx.fillRect(seg.x * tileSize + 13, seg.y * tileSize + 5, 2, 2);
            }
        }
        
        // Рисуем змейку оппонента (красная)
        for (let i = 0; i < this.opponentSnake.length; i++) {
            const seg = this.opponentSnake[i];
            ctx.fillStyle = i === 0 ? "#ff6b6b" : "#b30000";
            ctx.fillRect(seg.x * tileSize, seg.y * tileSize, tileSize - 1, tileSize - 1);
            
            // Глаза для головы оппонента
            if (i === 0) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(seg.x * tileSize + 4, seg.y * tileSize + 4, 4, 4);
                ctx.fillRect(seg.x * tileSize + 12, seg.y * tileSize + 4, 4, 4);
                ctx.fillStyle = "#000000";
                ctx.fillRect(seg.x * tileSize + 5, seg.y * tileSize + 5, 2, 2);
                ctx.fillRect(seg.x * tileSize + 13, seg.y * tileSize + 5, 2, 2);
            }
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
