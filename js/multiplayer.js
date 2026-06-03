import { db, collection, addDoc, query, where, getDocs, updateDoc, onSnapshot, doc, deleteDoc } from './firebase-config.js';

export class MultiplayerManager {
    constructor(game) {
        this.game = game;
        this.roomId = null;
        this.playerId = null;
        this.isHost = false;
        this.localPlayerNumber = 1;
        this.roomListener = null;
        this.gameStateListener = null;
        this.roomDocRef = null;
        this.sendInterval = null;
        this.ready = false;
    }

    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    generatePlayerId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    }

    async createRoom(playerName) {
        try {
            this.playerId = this.generatePlayerId();
            this.isHost = true;
            this.localPlayerNumber = 1;
            
            const roomId = this.generateRoomId();
            
            const room = {
                roomId: roomId,
                hostId: this.playerId,
                player1: {
                    id: this.playerId,
                    name: playerName,
                    ready: false,
                    playerNumber: 1,
                    connected: true,
                    joinedAt: new Date().toISOString()
                },
                player2: null,
                status: 'waiting',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const docRef = await addDoc(collection(db, "multiplayer_rooms"), room);
            
            this.roomId = roomId;
            this.roomDocRef = docRef;
            
            localStorage.setItem('mp_room_id', this.roomId);
            localStorage.setItem('mp_player_id', this.playerId);
            
            this.listenToRoom();
            
            console.log("Room created:", this.roomId, "as Player 1");
            return { success: true, roomId: this.roomId };
        } catch (error) {
            console.error("Error creating room:", error);
            return { success: false, error: error.message };
        }
    }

    async joinRoom(roomId, playerName) {
        try {
            this.playerId = this.generatePlayerId();
            this.roomId = roomId.toUpperCase();
            this.isHost = false;
            this.localPlayerNumber = 2;
            
            const q = query(collection(db, "multiplayer_rooms"), where("roomId", "==", this.roomId));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                return { success: false, error: "Room not found" };
            }
            
            const roomDoc = querySnapshot.docs[0];
            const roomData = roomDoc.data();
            
            if (roomData.status !== 'waiting') {
                return { success: false, error: "Game already started" };
            }
            
            if (roomData.player2 !== null) {
                return { success: false, error: "Room is full" };
            }
            
            await updateDoc(doc(db, "multiplayer_rooms", roomDoc.id), {
                player2: {
                    id: this.playerId,
                    name: playerName,
                    ready: false,
                    playerNumber: 2,
                    connected: true,
                    joinedAt: new Date().toISOString()
                },
                updatedAt: new Date().toISOString()
            });
            
            this.roomDocRef = roomDoc.ref;
            localStorage.setItem('mp_room_id', this.roomId);
            localStorage.setItem('mp_player_id', this.playerId);
            
            this.listenToRoom();
            
            console.log("Joined room:", this.roomId, "as Player 2");
            return { success: true };
        } catch (error) {
            console.error("Error joining room:", error);
            return { success: false, error: error.message };
        }
    }

    listenToRoom() {
        if (this.roomListener) return;
        
        const q = query(collection(db, "multiplayer_rooms"), where("roomId", "==", this.roomId));
        
        this.roomListener = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                this.handleRoomClosed();
                return;
            }
            
            const roomDoc = snapshot.docs[0];
            const roomData = roomDoc.data();
            this.roomDocRef = roomDoc.ref;
            
            console.log("Room update:", roomData.status, "Player1 ready:", roomData.player1?.ready, "Player2 ready:", roomData.player2?.ready);
            
            // Проверяем готовность оппонента
            if (this.isHost) {
                if (roomData.player2 && this.game.onOpponentReady) {
                    this.game.onOpponentReady(roomData.player2.ready);
                }
            } else {
                if (roomData.player1 && this.game.onOpponentReady) {
                    this.game.onOpponentReady(roomData.player1.ready);
                }
            }
            
            // Запускаем игру если оба готовы
            if (roomData.status === 'playing' && this.game.currentScreen !== 'GAME_MP') {
                console.log("Starting game! Both players ready");
                this.startMultiplayerGame();
            } else if (roomData.status === 'finished') {
                this.handleGameFinished(roomData);
            }
        });
    }

    async sendReady() {
        if (!this.roomDocRef) return;
        
        console.log("Sending ready as Player", this.localPlayerNumber);
        
        const updateData = this.isHost 
            ? { 'player1.ready': true, updatedAt: new Date().toISOString() }
            : { 'player2.ready': true, updatedAt: new Date().toISOString() };
        
        await updateDoc(this.roomDocRef, updateData);
        this.ready = true;
        
        // Проверяем готовность обоих
        const q = query(collection(db, "multiplayer_rooms"), where("roomId", "==", this.roomId));
        const querySnapshot = await getDocs(q);
        const roomData = querySnapshot.docs[0].data();
        
        const player1Ready = roomData.player1?.ready || false;
        const player2Ready = roomData.player2?.ready || false;
        
        console.log("Player1 ready:", player1Ready, "Player2 ready:", player2Ready);
        
        if (player1Ready && player2Ready && roomData.status === 'waiting') {
            console.log("Both ready! Starting game...");
            await updateDoc(this.roomDocRef, { 
                status: 'playing',
                updatedAt: new Date().toISOString()
            });
        }
    }

    startMultiplayerGame() {
        console.log("Starting multiplayer game as Player", this.localPlayerNumber);
        this.game.currentScreen = 'GAME_MP';
        this.game.isMultiplayer = true;
        this.game.multiplayerLocalNumber = this.localPlayerNumber;
        this.game.resetMultiplayer();
        this.startStateSender();
        this.listenToGameState();
    }

    listenToGameState() {
        if (this.gameStateListener) return;
        
        console.log("Listening to game states for room:", this.roomId);
        
        const q = query(collection(db, "multiplayer_game_states"), where("roomId", "==", this.roomId));
        
        this.gameStateListener = onSnapshot(q, (snapshot) => {
            snapshot.forEach((doc) => {
                const state = doc.data();
                if (state.playerId !== this.playerId) {
                    console.log("Received opponent state, score:", state.score);
                    if (this.game.updateOpponent) {
                        this.game.updateOpponent(state);
                    }
                }
            });
        });
    }

    startStateSender() {
        if (this.sendInterval) clearInterval(this.sendInterval);
        
        this.sendInterval = setInterval(async () => {
            if (this.game.isMultiplayer && !this.game.gameOver && this.game.currentScreen === 'GAME_MP') {
                await this.sendGameState({
                    snake: this.game.snake,
                    score: this.game.score,
                    alive: !this.game.gameOver
                });
            }
        }, 50);
    }

    async sendGameState(gameState) {
        if (!this.roomId || !this.playerId) return;
        if (!gameState.snake || gameState.snake.length === 0) return;
        
        try {
            const q = query(
                collection(db, "multiplayer_game_states"),
                where("roomId", "==", this.roomId),
                where("playerId", "==", this.playerId)
            );
            
            const querySnapshot = await getDocs(q);
            const stateData = {
                roomId: this.roomId,
                playerId: this.playerId,
                playerNumber: this.localPlayerNumber,
                snake: gameState.snake.map(seg => ({ x: seg.x, y: seg.y })),
                score: gameState.score,
                alive: gameState.alive,
                timestamp: Date.now()
            };
            
            if (querySnapshot.empty) {
                await addDoc(collection(db, "multiplayer_game_states"), stateData);
            } else {
                await updateDoc(querySnapshot.docs[0].ref, stateData);
            }
        } catch (error) {
            console.error("Error sending game state:", error);
        }
    }

    async sendGameOver(winner) {
        if (!this.roomDocRef) return;
        await updateDoc(this.roomDocRef, {
            status: 'finished',
            winner: winner,
            finishedAt: new Date().toISOString()
        });
        this.cleanup();
    }

    handleGameFinished(roomData) {
        if (this.game.onMultiplayerFinished) {
            this.game.onMultiplayerFinished(roomData.winner);
        }
    }

    handleRoomClosed() {
        if (this.game.onRoomClosed) {
            this.game.onRoomClosed();
        }
        this.cleanup();
    }

    async leaveRoom() {
        if (this.sendInterval) {
            clearInterval(this.sendInterval);
            this.sendInterval = null;
        }
        
        if (this.roomDocRef) {
            try {
                await updateDoc(this.roomDocRef, {
                    [`player${this.localPlayerNumber}.connected`]: false,
                    status: 'closed'
                });
            } catch(e) {}
        }
        this.cleanup();
    }

    cleanup() {
        if (this.sendInterval) {
            clearInterval(this.sendInterval);
            this.sendInterval = null;
        }
        if (this.roomListener) {
            this.roomListener();
            this.roomListener = null;
        }
        if (this.gameStateListener) {
            this.gameStateListener();
            this.gameStateListener = null;
        }
        
        localStorage.removeItem('mp_room_id');
        localStorage.removeItem('mp_player_id');
        
        this.roomId = null;
        this.playerId = null;
        this.roomDocRef = null;
        this.ready = false;
    }
}