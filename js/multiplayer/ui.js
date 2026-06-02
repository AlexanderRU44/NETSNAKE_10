// ui.js - UI для мультиплеера (встроенный в игровое поле)
export class MultiplayerUI {
    constructor(game, peerManager, multiplayerGame) {
        this.game = game;
        this.peerManager = peerManager;
        this.multiplayerGame = multiplayerGame;
        this.isActive = false;
        this.roomCode = null;
        this.status = "Waiting...";
        this.isHost = false;
    }

    // Создание UI внутри игрового поля
    createUI() {
        this.isActive = true;
        this.game.currentScreen = "MULTIPLAYER";
        this.game.isPaused = true;
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
        ctx.fillStyle = "#58a6ff";
        ctx.fillText(this.status, 200, 200);
        
        // Кнопки
        if (!this.roomCode) {
            // Кнопка CREATE
            ctx.fillStyle = "#4a90e2";
            ctx.fillRect(70, 230, 120, 35);
            ctx.fillStyle = "#ffffff";
            ctx.font = "9px 'Press Start 2P'";
            ctx.fillText("CREATE", 130, 252);
            
            // Поле для ввода кода
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.strokeRect(200, 230, 130, 35);
            ctx.fillStyle = "#ffffff";
            ctx.font = "8px 'Press Start 2P'";
            ctx.fillText("ENTER CODE", 265, 248);
            
            // Кнопка JOIN
            ctx.fillStyle = "#7ed321";
            ctx.fillRect(200, 270, 130, 35);
            ctx.fillStyle = "#ffffff";
            ctx.font = "9px 'Press Start 2P'";
            ctx.fillText("JOIN", 265, 292);
        } else {
            // Кнопка COPY (если есть код)
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
        
        // Если есть ввод кода и показываем индикатор
        if (this.joinCodeInput && this.joinCodeInput.active) {
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(200, 230, 130, 35);
            ctx.fillStyle = "#ffffff";
            ctx.font = "14px monospace";
            ctx.fillText(this.joinCodeInput.value + (this.joinCodeInput.blink ? "_" : " "), 265, 253);
        }
        
        // Анимация мигания для ожидания
        if (this.status === "Waiting for opponent..." && Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillStyle = "rgba(88, 166, 255, 0.3)";
            ctx.fillRect(44, 44, 312, 312);
        }
    }

    // Обработка кликов по канвасу
    handleClick(mouseX, mouseY) {
        if (!this.isActive) return false;
        
        const canvasWidth = this.game.canvas.width;
        const canvasHeight = this.game.canvas.height;
        
        // Определяем границы кнопок
        const createBtn = { x: 70, y: 230, w: 120, h: 35 };
        const joinBtn = { x: 200, y: 270, w: 130, h: 35 };
        const copyBtn = { x: 100, y: 280, w: 200, h: 35 };
        const backBtn = { x: 140, y: 330, w: 120, h: 25 };
        const codeField = { x: 200, y: 230, w: 130, h: 35 };
        
        // Проверка координат
        if (mouseX >= backBtn.x && mouseX <= backBtn.x + backBtn.w &&
            mouseY >= backBtn.y && mouseY <= backBtn.y + backBtn.h) {
            this.close();
            this.game.currentScreen = "MAIN";
            return true;
        }
        
        if (!this.roomCode) {
            // Режим выбора - CREATE или JOIN
            if (mouseX >= createBtn.x && mouseX <= createBtn.x + createBtn.w &&
                mouseY >= createBtn.y && mouseY <= createBtn.y + createBtn.h) {
                this.createRoom();
                return true;
            }
            
            if (mouseX >= joinBtn.x && mouseX <= joinBtn.x + joinBtn.w &&
                mouseY >= joinBtn.y && mouseY <= joinBtn.y + joinBtn.h) {
                if (this.joinCodeInput && this.joinCodeInput.value && this.joinCodeInput.value.length === 6) {
                    this.joinRoom(this.joinCodeInput.value);
                }
                return true;
            }
            
            // Клик по полю ввода кода
            if (mouseX >= codeField.x && mouseX <= codeField.x + codeField.w &&
                mouseY >= codeField.y && mouseY <= codeField.y + codeField.h) {
                this.showVirtualKeyboard();
                return true;
            }
        } else {
            // Режим ожидания - кнопка COPY
            if (mouseX >= copyBtn.x && mouseX <= copyBtn.x + copyBtn.w &&
                mouseY >= copyBtn.y && mouseY <= copyBtn.y + copyBtn.h) {
                this.copyRoomCode();
                return true;
            }
        }
        
        return false;
    }

    // Показать виртуальную клавиатуру для ввода кода
    showVirtualKeyboard() {
        // Создаем инпут в DOM для ввода кода
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 6;
        input.style.position = 'fixed';
        input.style.top = '-100px';
        input.style.left = '-100px';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';
        document.body.appendChild(input);
        
        input.focus();
        
        const handleInput = () => {
            let val = input.value.replace(/[^0-9]/g, '').substring(0, 6);
            this.joinCodeInput = { value: val, active: true, blink: true };
            input.removeEventListener('input', handleInput);
            input.removeEventListener('blur', handleBlur);
            document.body.removeChild(input);
            
            // Если введено 6 цифр, автоматически подключаемся
            if (val.length === 6) {
                setTimeout(() => this.joinRoom(val), 100);
            }
        };
        
        const handleBlur = () => {
            input.removeEventListener('input', handleInput);
            input.removeEventListener('blur', handleBlur);
            document.body.removeChild(input);
            this.joinCodeInput = { value: "", active: false, blink: false };
        };
        
        input.addEventListener('input', handleInput);
        input.addEventListener('blur', handleBlur);
        
        this.joinCodeInput = { value: "", active: true, blink: true };
        
        // Анимация мигания курсора
        const blinkInterval = setInterval(() => {
            if (this.joinCodeInput && this.joinCodeInput.active) {
                this.joinCodeInput.blink = !this.joinCodeInput.blink;
            } else {
                clearInterval(blinkInterval);
            }
        }, 500);
    }

    // Создание комнаты (хост)
    async createRoom() {
        this.status = "Creating room...";
        try {
            await this.peerManager.init();
            this.roomCode = this.peerManager.createRoom();
            this.isHost = true;
            this.status = "Waiting for opponent...";
            
            // Ожидаем подключения оппонента
            this.peerManager.onConnectionOpen = () => {
                this.status = "Opponent connected! Starting game...";
                setTimeout(() => {
                    this.startGame();
                }, 1000);
            };
            
            this.peerManager.onOpponentDisconnect = () => {
                this.status = "Opponent disconnected!";
                setTimeout(() => {
                    this.close();
                    this.game.showMultiplayerMessage("Opponent disconnected");
                }, 2000);
            };
            
            this.peerManager.onError = (error) => {
                this.status = "Error: " + error.message;
            };
        } catch (error) {
            this.status = "Failed to create room";
            console.error(error);
        }
    }

    // Подключение к комнате (клиент)
    async joinRoom(roomCode) {
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
                setTimeout(() => {
                    this.close();
                    this.game.showMultiplayerMessage("Opponent disconnected");
                }, 2000);
            };
            
            this.peerManager.onError = (error) => {
                this.status = "Error: " + error.message;
            };
        } catch (error) {
            this.status = "Connection failed";
            console.error(error);
        }
    }

    // Копирование кода комнаты
    copyRoomCode() {
        if (this.roomCode) {
            navigator.clipboard.writeText(this.roomCode).then(() => {
                this.status = "Code copied!";
                setTimeout(() => {
                    this.status = "Waiting for opponent...";
                }, 2000);
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
        this.joinCodeInput = null;
    }
}