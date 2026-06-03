import { db, collection, addDoc, query, where, getDocs, updateDoc, onSnapshot, doc } from './firebase-config.js';

export class MultiplayerManager {
    constructor(game) {
        this.game = game;
        this.roomId = null;
        this.playerId = null;
        this.opponentId = null;
        this.isHost = false;
        this.roomListener = null;
        this.gameStateListener = null;
        this.roomDocRef = null;
        this.opponentData = null;
        this.localPlayerNumber = 1;
    }

    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    generatePlayerId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    async createRoom(playerName) {
        try {
            this.playerId = this.generatePlayerId();
            this.isHost = true;
            
            const roomId = this.generateRoomId();
            
            const room = {
                roomId: roomId,
                hostId: this.playerId,
                player1: {
                    id: this.playerId,
                    name: playerName,
                    ready: false,
                    snake: null,
                    score: 0,
                    connected: true,
                    joinedAt: new Date()
                },
                player2: null,
                status: 'waiting',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            const docRef = await addDoc(collection(db, "multiplayer_rooms"), room);
            
            this.roomId = roomId;
            this.roomDocRef = docRef;
            
            localStorage.setItem('mp_room_id', this.roomId);
            localStorage.setItem('mp_player_id', this.playerId);
            
            this.listenToRoom();
            
            return { success: true, roomId: this.roomId };
        } catch (error) {
            console.error("Error creating room:", error);
            return { success: false, error: error.message };
        }
    }

    async joinRoom(roomId, playerName) {
        try {
            this.playerId = this.generatePlayerId();
            this.roomId = roomId;
            
            const q = query(collection(db, "multiplayer_rooms"), where("roomId", "==", roomId));
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
                    snake: null,
                    score: 0,
                    connected: true,
                    joinedAt: new Date()
                },
                updatedAt: new Date()
            });
            
            this.roomDocRef = roomDoc.ref;
            localStorage.setItem('mp_room_id', this.roomId);
            localStorage.setItem('mp_player_id', this.playerId);
            
            this.isHost = false;
            this.listenToRoom();
            
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
            
            if (roomData.player1 && roomData.player1.id === this.playerId) {
                this.localPlayerNumber = 1;
                this.opponentId = roomData.player2?.id || null;
                this.opponentData = roomData.player2;
            } else if (roomData.player2 && roomData.player2.id === this.playerId) {
                this.localPlayerNumber = 2;
                this.opponentId = roomData.player1.id;
                this.opponentData = roomData.player1;
            }
            
            if (roomData.status === 'playing' && this.game.currentScreen !== 'GAME_MP') {
                this.startMultiplayerGame(roomData);
            } else if (roomData.status === 'finished') {
                this.handleGameFinished(roomData);
            }
            
            if (this.game.onOpponentReady && this.opponentData) {
                this.game.onOpponentReady(this.opponentData.ready);
            }
        });
    }

    async sendReady() {
        if (!this.roomDocRef) return;
        
        const updateData = this.localPlayerNumber === 1 
            ? { 'player1.ready': true, updatedAt: new Date() }
            : { 'player2.ready': true, updatedAt: new Date() };
        
        await updateDoc(this.roomDocRef, updateData);
        
        const q = query(collection(db, "multiplayer_rooms"), where("roomId", "==", this.roomId));
        const querySnapshot = await getDocs(q);
        const roomData = querySnapshot.docs[0].data();
        
        if (roomData.player1?.ready && roomData.player2?.ready && roomData.status === 'waiting') {
            await updateDoc(this.roomDocRef, { status: 'playing' });
        }
    }

    startMultiplayerGame(roomData) {
        this.game.currentScreen = 'GAME_MP';
        this.game.isMultiplayer = true;
        this.game.multiplayerLocalNumber = this.localPlayerNumber;
        this.game.resetMultiplayer();
        this.listenToGameState();
    }

    listenToGameState() {
        if (this.gameStateListener) return;
        
        const q = query(collection(db, "multiplayer_game_states"), where("roomId", "==", this.roomId));
        
        this.gameStateListener = onSnapshot(q, (snapshot) => {
            snapshot.forEach((doc) => {
                const state = doc.data();
                if (state.playerId !== this.playerId) {
                    if (this.game.updateOpponent) {
                        this.game.updateOpponent(state);
                    }
                }
            });
        });
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
            finishedAt: new Date()
        });
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
        if (this.roomDocRef) {
            await updateDoc(this.roomDocRef, {
                [`player${this.localPlayerNumber}.connected`]: false
            });
        }
        this.cleanup();
    }

    cleanup() {
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
        this.opponentId = null;
        this.roomDocRef = null;
    }
}
