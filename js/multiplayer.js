import { getDatabase, ref, set, get, onValue, remove, update, push } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js';
import { app } from './firebase-config.js';

export class Multiplayer {
    constructor(game) {
        this.game = game;
        this.rtdb = getDatabase(app);
        this.roomId = null;
        this.playerId = null; // 0 = хост, 1 = гость
        this.gameStateRef = null;
        this.isHost = false;
        this.listener = null;
    }

    async createRoom() {
        const roomRef = ref(this.rtdb, 'games/');
        const newRoomRef = push(roomRef);
        this.roomId = newRoomRef.key;
        this.playerId = 0;
        this.isHost = true;
        
        const gameState = {
            player1: {
                snake: this.game.snake.map(s => ({ ...s })),
                score: 0,
                dx: 1,
                dy: 0,
                connected: true,
                ready: false
            },
            player2: null,
            food: { x: this.game.food.x, y: this.game.food.y },
            status: 'waiting',
            turn: 0,
            lastUpdate: Date.now(),
            foodType: this.game.foodType,
            winner: null
        };
        
        await set(newRoomRef, gameState);
        this.gameStateRef = ref(this.rtdb, `games/${this.roomId}`);
        this.listenForChanges();
        
        return this.roomId;
    }
    
    async joinRoom(roomId) {
        this.roomId = roomId;
        this.playerId = 1;
        this.isHost = false;
        this.gameStateRef = ref(this.rtdb, `games/${this.roomId}`);
        
        const snapshot = await get(this.gameStateRef);
        if (!snapshot.exists()) {
            throw new Error('Room not found');
        }
        
        const state = snapshot.val();
        if (state.status !== 'waiting') {
            throw new Error('Game already started');
        }
        
        await update(ref(this.rtdb, `games/${this.roomId}`), {
            player2: {
                snake: this.game.snake.map(s => ({ ...s })),
                score: 0,
                dx: -1,
                dy: 0,
                connected: true,
                ready: false
            },
            status: 'ready'
        });
        
        this.listenForChanges();
    }
    
    startGame() {
        if (!this.isHost) return;
        update(ref(this.rtdb, `games/${this.roomId}`), {
            status: 'playing',
            turn: 0,
            lastUpdate: Date.now()
        });
    }
    
    setReady() {
        const updateData = {};
        if (this.playerId === 0) {
            updateData['player1/ready'] = true;
        } else {
            updateData['player2/ready'] = true;
        }
        update(ref(this.rtdb, `games/${this.roomId}`), updateData).then(() => {
            this.checkBothReady();
        });
    }
    
    async checkBothReady() {
        const snapshot = await get(this.gameStateRef);
        const state = snapshot.val();
        if (state.player1?.ready && state.player2?.ready && state.status === 'ready') {
            this.startGame();
        }
    }
    
    listenForChanges() {
        if (this.listener) return;
        this.listener = onValue(this.gameStateRef, (snapshot) => {
            const state = snapshot.val();
            if (!state) return;
            
            // Обновляем змейку соперника
            if (this.playerId === 0 && state.player2) {
                this.game.opponentSnake = state.player2.snake || [];
                this.game.opponentScore = state.player2.score || 0;
            } else if (this.playerId === 1 && state.player1) {
                this.game.opponentSnake = state.player1.snake || [];
                this.game.opponentScore = state.player1.score || 0;
            }
            
            // Обновляем еду (только хост генерирует)
            if (state.food && (this.isHost || state.food)) {
                this.game.food = state.food;
            }
            if (state.foodType) {
                this.game.foodType = state.foodType;
            }
            
            // Проверка победителя
            if (state.winner !== null && state.winner !== undefined) {
                const iWon = (state.winner === this.playerId);
                this.game.endGame(true, iWon);
            }
            
            // Обновляем turn
            if (state.turn !== undefined && state.turn !== this.playerId && !this.game.isPaused && this.game.currentScreen !== "GAMEOVER") {
                this.game.canMove = true;
            } else if (state.turn === this.playerId) {
                this.game.canMove = true;
            } else {
                this.game.canMove = false;
            }
            
            // Обновляем статус игры
            if (state.status === 'playing' && this.game.isPaused && this.game.currentScreen === "WAITING") {
                this.game.isPaused = false;
                this.game.currentScreen = "GAME";
            }
        });
    }
    
    sendMove() {
        if (!this.roomId) return;
        const updateData = {
            lastUpdate: Date.now(),
            turn: (this.playerId === 0) ? 1 : 0
        };
        if (this.playerId === 0) {
            updateData['player1/snake'] = this.game.snake.map(s => ({ ...s }));
            updateData['player1/score'] = this.game.score;
            updateData['player1/dx'] = this.game.dx;
            updateData['player1/dy'] = this.game.dy;
        } else {
            updateData['player2/snake'] = this.game.snake.map(s => ({ ...s }));
            updateData['player2/score'] = this.game.score;
            updateData['player2/dx'] = this.game.dx;
            updateData['player2/dy'] = this.game.dy;
        }
        update(ref(this.rtdb, `games/${this.roomId}`), updateData);
    }
    
    sendFood(food, foodType) {
        if (!this.roomId || !this.isHost) return;
        update(ref(this.rtdb, `games/${this.roomId}`), {
            food: food,
            foodType: foodType,
            lastUpdate: Date.now()
        });
    }
    
    sendGameOver(winner) {
        if (!this.roomId) return;
        update(ref(this.rtdb, `games/${this.roomId}`), {
            winner: winner,
            status: 'finished',
            lastUpdate: Date.now()
        });
    }
    
    leaveRoom() {
        if (this.listener) {
            this.listener();
            this.listener = null;
        }
        if (this.roomId) {
            if (this.isHost) {
                set(ref(this.rtdb, `games/${this.roomId}`), null);
            } else {
                update(ref(this.rtdb, `games/${this.roomId}`), {
                    player2: null,
                    status: 'waiting'
                });
            }
        }
        this.roomId = null;
        this.playerId = null;
        this.gameStateRef = null;
        this.isHost = false;
    }
}