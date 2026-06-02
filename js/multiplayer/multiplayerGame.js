// multiplayerGame.js - логика мультиплеерной игры
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
        this.updateInterval = 50; // 20 FPS для сетевых обновлений
    }

    // Инициализация мультиплеера
    init(isHost) {
        this.isHost = isHost;
        this.setupEventListeners();
        this.initGameState();
    }

    // Настройка слушателей Peer
    setupEventListeners() {
        this.peerManager.onDataReceived = (data) => {
            this.handleNetworkMessage(data);
        };
        
        this.peerManager.onConnectionOpen = () => {
            if (this.isHost) {
                this.startGame();
            }
        };
        
        this.peerManager.onOpponentDisconnect = () => {
            this.endGame('Opponent disconnected');
        };
        
        this.peerManager.onError = (error) => {
            console.error('Peer error:', error);
            this.endGame('Connection error: ' + error.message);
        };
    }

    // Инициализация игрового состояния
    initGameState() {
        this.tileCount = 20;
        
        if (this.isHost) {
            // Хост - змейка слева
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
            // Клиент - змейка справа
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
    }

    // Генерация еды (не на змейках)
    generateFood() {
        const maxAttempts = 100;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
            
            let onSnake = false;
            for (const segment of this.mySnake) {
                if (segment.x === food.x && segment.y === food.y) {
                    onSnake = true;
                    break;
                }
            }
            for (const segment of this.opponentSnake) {
                if (segment.x === food.x && segment.y === food.y) {
                    onSnake = true;
                    break;
                }
            }
            
            if (!onSnake) {
                this.food = food;
                return;
            }
        }
    }

    // Старт игры
    startGame() {
        this.gameActive = true;
        this.lastUpdateTime = Date.now();
        
        // Отправляем начальное состояние оппоненту
        this.sendGameState();
        
        // Запускаем игровой цикл
        this.gameLoopInterval = setInterval(() => {
            this.update();
        }, 100); // 10 FPS для игровой логики
    }

    // Игровой цикл
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
            this.sendGameState();
        } else {
            this.mySnake.pop();
        }
        
        // Проверка столкновений
        if (this.checkCollisions()) {
            this.endGame('You crashed!');
            return;
        }
        
        // Отправляем обновление оппоненту
        this.sendGameState();
        
        // Обновляем UI
        this.updateUI();
    }

    // Проверка столкновений
    checkCollisions() {
        const head = this.mySnake[0];
        
        // Столкновение с собой
        for (let i = 1; i < this.mySnake.length; i++) {
            if (head.x === this.mySnake[i].x && head.y === this.mySnake[i].y) {
                return true;
            }
        }
        
        // Столкновение со змейкой оппонента
        for (const segment of this.opponentSnake) {
            if (head.x === segment.x && head.y === segment.y) {
                return true;
            }
        }
        
        return false;
    }

    // Обработка сетевых сообщений
    handleNetworkMessage(data) {
        switch (data.type) {
            case 'gameState':
                this.updateOpponentState(data);
                break;
            case 'direction':
                this.updateOpponentDirection(data);
                break;
            case 'gameEnd':
                this.endGame(data.message);
                break;
            case 'hostReady':
                if (!this.isHost) {
                    this.startGame();
                }
                break;
        }
    }

    // Обновление состояния оппонента
    updateOpponentState(data) {
        this.opponentSnake = data.snake;
        this.opponentScore = data.score;
        this.food = data.food;
        this.updateUI();
    }

    // Обновление направления оппонента
    updateOpponentDirection(data) {
        // Для отображения движения оппонента (опционально)
    }

    // Отправка состояния игры
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

    // Отправка направления движения
    sendDirection(dx, dy) {
        if (!this.gameActive) return;
        
        this.nextDirection = { dx, dy };
        
        this.peerManager.sendMessage({
            type: 'direction',
            dx: dx,
            dy: dy,
            timestamp: Date.now()
        });
    }

    // Обновление UI
    updateUI() {
        // Обновляем HUD в основной игре
        if (this.game.updateMultiplayerHUD) {
            this.game.updateMultiplayerHUD(this.myScore, this.opponentScore);
        }
    }

    // Завершение игры
    endGame(message) {
        if (!this.gameActive) return;
        
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
        
        // Показываем сообщение в игре
        if (this.game.showMultiplayerMessage) {
            this.game.showMultiplayerMessage(message);
        }
        
        playSound("die", this.game.soundEnabled);
    }

    // Отрисовка мультиплеерной игры
    draw(ctx, tileSize) {
        if (!this.gameActive && !this.food) return;
        
        // Рисуем еду
        ctx.fillStyle = "#ff4d4d";
        ctx.fillRect(this.food.x * tileSize, this.food.y * tileSize, tileSize - 1, tileSize - 1);
        
        // Рисуем змейку игрока
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
        
        // Рисуем змейку оппонента
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

    // Очистка
    cleanup() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
        this.gameActive = false;
    }
}