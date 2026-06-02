// ui.js - UI для мультиплеера (встроенный в игровое поле)
export class MultiplayerUI {
    constructor(game, peerManager, multiplayerGame) {
        this.game = game;
        this.peerManager = peerManager;
        this.multiplayerGame = multiplayerGame;
        this.isActive = false;
        this.roomCode = null;
        this.status = "Choose action...";
        this.isHost = false;
        this.isConnecting = false;
    }

    // Создание UI
    createUI() {
        this.isActive = true;
        this.game.currentScreen = "MULTIPLAYER";
        this.game.isPaused = true;
        this.roomCode = null;
        this.status = "Choose action...";
        this.isConnecting = false;
    }

    // Отрисовка UI на канвасе
    draw(ctx, canvasWidth, canvasHeight) {
        if (!this.isActive) return;

        // Полупрозрачный фон
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Основное окно
        ctx.fillStyle = this.game.isDarkTheme ? "#161b22" : "#2b3a4a";
        ctx.fillRect(40, 40, 320, 320);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(44, 44, 312, 312);
        
        // Заголовок
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText("MULTIPLAYER", 200, 75);
        ctx.fillRect(60, 90, 280, 2);
        
        // Код комнаты (если создана)
        if (this.roomCode) {
            ctx.font = "10px 'Press Start 2P'";
            ctx.fillStyle = "#8bac0f";
            ctx.fillText("ROOM CODE:", 200, 130);
            ctx.font = "18px monospace";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(this.roomCode, 200, 165);
        }
        
        // Статус
        ctx.font = "9px 'Press Start 2P'";
        ctx.fillStyle = this.isConnecting ? "#ffb900" : "#58a6ff";
        ctx.fillText(this.status, 200, 205);
        
        // Анимация ожидания
        if (this.status === "Waiting for opponent..." && Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillStyle = "rgba(88, 166, 255, 0.2)";
            ctx.fillRect(44, 44, 312, 312);
        }
        
        if (this.status === "Connecting..." && Math.floor(Date.now() / 300) % 2 === 0) {
            ctx.fillStyle = "rgba(255, 185, 0, 0.2)";
            ctx.fillRect(44, 44, 312, 312);
        }
        
        if (!this.roomCode && !this.isConnecting) {
            // Кнопка CREATE
            ctx.fillStyle = "#4a90e2";
            ctx.fillRect(70, 230, 120, 35);
            ctx.fillStyle = "#ffffff";
            ctx.font = "9px 'Press Start 2P'";
            ctx.fillText("CREATE", 130, 252);
            
            // Поле для ввода кода (упрощённое)
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.strokeRect(200, 230, 130, 35);
            ctx.fillStyle = "#ffffff";
            ctx.font = "8px 'Press Start 2P'";
            ctx.fillText("TAP TO ENTER", 265, 248);
            
            // Кнопка JOIN
            ctx.fillStyle = "#7ed321";
            ctx.fillRect(200, 270, 130, 35);
            ctx.fillStyle = "#ffffff";
            ctx.font = "9px 'Press Start 2P'";
            ctx.fillText("JOIN", 265, 292);
            
            // Подсказка
            ctx.font = "7px 'Press Start 2P'";
            ctx.fillStyle = "#8b949e";
            ctx.fillText("Enter 6-digit code", 200, 325);
        } else if (this.roomCode && !this.isConnecting) {
            // Кнопка COPY
            ctx.fillStyle = "#58a6ff";
            ctx.fillRect(100, 280, 200, 35);
            ctx.fillStyle = "#ffffff";
            ctx.font = "8px 'Press Start 2P'";
            ctx.fillText("COPY CODE", 200, 302);
        }
        
        // Кнопка BACK
        ctx.fillStyle = "#ff5c5c";
        ctx.fillRect(140, 330, 120, 25);
        ctx.fillStyle = "#ffffff";
        ctx.font = "8px 'Press Start 2P'";
        ctx.fillText("BACK", 200, 347);
    }

    // Обработка кликов по канвасу
    handleClick(mouseX, mouseY) {
        if (!this.isActive) return false;
        if (this.isConnecting) return false;
        
        const backBtn = { x: 140, y: 330, w: 120, h: 25 };
        const createBtn = { x: 70, y: 230, w: 120, h: 35 };
        const joinBtn = { x: 200, y: 270, w: 130, h: 35 };
        const codeField = { x: 200, y: 230, w: 130, h: 35 };
        const copyBtn = { x: 100, y: 280, w: 200, h: 35 };
        
        // Кнопка BACK
        if (mouseX >= backBtn.x && mouseX <= backBtn.x + backBtn.w &&
            mouseY >= backBtn.y && mouseY <= backBtn.y + backBtn.h) {
            this.close();
            this.game.currentScreen = "MAIN";
            return true;
        }
        
        // Если есть код комнаты - режим ожидания
        if (this.roomCode && !this.isConnecting) {
            // Кнопка COPY
            if (mouseX >= copyBtn.x && mouseX <= copyBtn.x + copyBtn.w &&
                mouseY >= copyBtn.y && mouseY <= copyBtn.y + copyBtn.h) {
                this.copyRoomCode();
                return true;
            }
            return false;
        }
        
        // Режим выбора действия
        if (!this.roomCode) {
            // Кнопка CREATE
            if (mouseX >= createBtn.x && mouseX <= createBtn.x + createBtn.w &&
                mouseY >= createBtn.y && mouseY <= createBtn.y + createBtn.h) {
                this.createRoom();
                return true;
            }
            
            // Кнопка JOIN
            if (mouseX >= joinBtn.x && mouseX <= joinBtn.x + joinBtn.w &&
                mouseY >= joinBtn.y && mouseY <= joinBtn.y + joinBtn.h) {
                this.showCodeInput();
                return true;
            }
            
            // Клик по полю ввода кода
            if (mouseX >= codeField.x && mouseX <= codeField.x + codeField.w &&
                mouseY >= codeField.y && mouseY <= codeField.y + codeField.h) {
                this.showCodeInput();
                return true;
            }
        }
        
        return false;
    }

    // Показать диалог ввода кода (работает на Android)
    showCodeInput() {
        // Используем стандартный prompt - работает на всех устройствах
        const code = prompt("Введите 6-значный код комнаты:", "");
        
        if (code && code.length === 6 && /^\d+$/.test(code)) {
            this.joinRoom(code);
        } else if (code && code.length > 0) {
            alert("Код должен состоять из 6 цифр!");
            this.status = "Invalid code!";
            setTimeout(() => {
                if (this.isActive) this.status = "Choose action...";
            }, 2000);
        }
    }

    // Создание комнаты (хост)
    async createRoom() {
        this.isConnecting = true;
        this.status = "Creating room...";
        
        try {
            await this.peerManager.init();
            this.roomCode = this.peerManager.createRoom();
            this.isHost = true;
            this.status = "Waiting for opponent...";
            this.isConnecting = false;
            
            // Показываем код в alert для удобства
            alert("Your room code: " + this.roomCode + "\nSend this code to your friend!");
            
            // Ожидаем подключения оппонента
            this.peerManager.onConnectionOpen = () => {
                this.status = "Opponent connected! Starting game...";
                setTimeout(() => {
                    this.startGame();
                }, 1000);
            };
            
            this.peerManager.onOpponentDisconnect = () => {
                this.status = "Opponent disconnected!";
                this.isConnecting = false;
                setTimeout(() => {
                    if (this.isActive) {
                        this.close();
                        this.game.showMultiplayerMessage("Opponent disconnected");
                    }
                }, 2000);
            };
            
            this.peerManager.onError = (error) => {
                console.error('Peer error:', error);
                this.status = "Connection error!";
                this.isConnecting = false;
                setTimeout(() => {
                    if (this.isActive) {
                        this.close();
                        this.game.showMultiplayerMessage("Connection failed. Check internet.");
                    }
                }, 2000);
            };
            
        } catch (error) {
            console.error('Create room error:', error);
            this.status = "Failed to create room!";
            this.isConnecting = false;
            setTimeout(() => {
                if (this.isActive) {
                    this.close();
                    this.game.showMultiplayerMessage("Failed to create room. Check internet.");
                }
            }, 2000);
        }
    }

    // Подключение к комнате (клиент)
    async joinRoom(roomCode) {
        this.isConnecting = true;
        this.status = "Connecting...";
        
        try {
            await this.peerManager.init();
            await this.peerManager.joinRoom(roomCode);
            this.roomCode = roomCode;
            this.isHost = false;
            this.status = "Connected! Starting game...";
            
            setTimeout(() => {
                this.startGame();
            }, 1000);
            
            this.peerManager.onOpponentDisconnect = () => {
                this.status = "Opponent disconnected!";
                this.isConnecting = false;
                setTimeout(() => {
                    if (this.isActive) {
                        this.close();
                        this.game.showMultiplayerMessage("Opponent disconnected");
                    }
                }, 2000);
            };
            
            this.peerManager.onError = (error) => {
                console.error('Peer error:', error);
                this.status = "Connection error!";
                this.isConnecting = false;
                setTimeout(() => {
                    if (this.isActive) {
                        this.close();
                        this.game.showMultiplayerMessage("Connection failed. Check internet.");
                    }
                }, 2000);
            };
            
        } catch (error) {
            console.error('Join room error:', error);
            this.status = "Failed to join!";
            this.isConnecting = false;
            setTimeout(() => {
                if (this.isActive) {
                    this.close();
                    this.game.showMultiplayerMessage("Failed to join room. Check code and internet.");
                }
            }, 2000);
        }
    }

    // Копирование кода комнаты
    copyRoomCode() {
        if (this.roomCode) {
            navigator.clipboard.writeText(this.roomCode).then(() => {
                this.status = "Code copied!";
                setTimeout(() => {
                    if (this.isActive && this.status === "Code copied!") {
                        this.status = "Waiting for opponent...";
                    }
                }, 2000);
            }).catch(() => {
                // Если не удалось скопировать, показываем код в alert
                alert("Room code: " + this.roomCode);
                this.status = "Code: " + this.roomCode;
                setTimeout(() => {
                    if (this.isActive) {
                        this.status = "Waiting for opponent...";
                    }
                }, 3000);
            });
        }
    }

    // Старт игры
    startGame() {
        this.multiplayerGame.init(this.isHost);
        this.close();
        this.game.startMultiplayerMode(this.multiplayerGame);
    }

    // Закрытие UI
    close() {
        this.isActive = false;
        this.roomCode = null;
        this.isConnecting = false;
    }
}
