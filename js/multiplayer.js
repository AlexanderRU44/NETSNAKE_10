export class MultiplayerManager {
    constructor(game) {
        this.game = game;
        this.roomId = null;
        this.playerId = null;
        this.isHost = false;
        this.localPlayerNumber = 1;
        this.channel = null;
        this.opponentData = null;
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
            this.roomId = this.generateRoomId();
            this.isHost = true;
            this.localPlayerNumber = 1;
            
            this.channel = new BroadcastChannel(`netsnake_${this.roomId}`);
            this.setupChannelListeners();
            
            this.sendMessage({
                type: 'host_ready',
                playerId: this.playerId,
                playerName: playerName,
                roomId: this.roomId,
                playerNumber: 1
            });
            
            localStorage.setItem('mp_room_id', this.roomId);
            localStorage.setItem('mp_player_id', this.playerId);
            
            this.startHeartbeat();
            
            console.log("Room created as Player 1, ID:", this.roomId);
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
            
            this.channel = new BroadcastChannel(`netsnake_${this.roomId}`);
            this.setupChannelListeners();
            
            this.sendMessage({
                type: 'join_request',
                playerId: this.playerId,
                playerName: playerName,
                roomId: this.roomId,
                playerNumber: 2
            });
            
            localStorage.setItem('mp_room_id', this.roomId);
            localStorage.setItem('mp_player_id', this.playerId);
            
            console.log("Join requested for room:", this.roomId, "as Player 2");
            return { success: true };
        } catch (error) {
            console.error("Error joining room:", error);
            return { success: false, error: error.message };
        }
    }

    setupChannelListeners() {
        this.channel.onmessage = (event) => {
            const data = event.data;
            console.log("Received:", data.type, data);
            
            switch (data.type) {
                case 'host_ready':
                    if (!this.isHost && this.roomId === data.roomId) {
                        this.sendMessage({
                            type: 'join_confirm',
                            playerId: this.playerId,
                            playerName: this.game.playerName,
                            targetHostId: data.playerId,
                            playerNumber: 2
                        });
                    }
                    break;
                    
                case 'join_confirm':
                    if (this.isHost && data.targetHostId === this.playerId) {
                        this.opponentData = {
                            playerId: data.playerId,
                            playerName: data.playerName,
                            playerNumber: data.playerNumber,
                            ready: false
                        };
                        this.game.onOpponentReady(false);
                        this.sendMessage({
                            type: 'connection_established',
                            playerId: this.playerId,
                            opponentId: data.playerId,
                            playerNumber: 1
                        });
                    }
                    break;
                    
                case 'connection_established':
                    if (data.opponentId === this.playerId) {
                        console.log("Connection established! I am Player", this.localPlayerNumber);
                        this.game.onOpponentReady(false);
                    }
                    break;
                    
                case 'player_ready':
                    if (data.playerId !== this.playerId) {
                        if (this.opponentData) {
                            this.opponentData.ready = true;
                        }
                        this.game.onOpponentReady(true);
                        
                        if (this.ready) {
                            this.sendMessage({
                                type: 'start_game',
                                playerId: this.playerId
                            });
                        }
                    }
                    break;
                    
                case 'start_game':
                    if (data.playerId !== this.playerId) {
                        this.startMultiplayerGame();
                    }
                    break;
                    
                case 'game_state':
                    if (data.playerId !== this.playerId && data.gameState) {
                        this.game.updateOpponent(data.gameState);
                    }
                    break;
                    
                case 'game_over':
                    if (data.playerId !== this.playerId) {
                        this.game.onMultiplayerFinished(data.winner);
                    }
                    break;
                    
                case 'player_left':
                    this.handleRoomClosed();
                    break;
            }
        };
    }

    sendMessage(data) {
        if (this.channel) {
            this.channel.postMessage(data);
        }
    }

    async sendReady() {
        this.ready = true;
        this.sendMessage({
            type: 'player_ready',
            playerId: this.playerId,
            ready: true
        });
        
        if (this.opponentData?.ready) {
            this.sendMessage({
                type: 'start_game',
                playerId: this.playerId
            });
            this.startMultiplayerGame();
        }
    }

    startMultiplayerGame() {
        console.log("Starting multiplayer game as Player", this.localPlayerNumber);
        this.game.currentScreen = 'GAME_MP';
        this.game.isMultiplayer = true;
        this.game.multiplayerLocalNumber = this.localPlayerNumber;
        this.game.resetMultiplayer();
        this.startStateSender();
    }

    startStateSender() {
        if (this.sendInterval) clearInterval(this.sendInterval);
        
        this.sendInterval = setInterval(() => {
            if (this.game.isMultiplayer && !this.game.gameOver && this.game.currentScreen === 'GAME_MP') {
                this.sendMessage({
                    type: 'game_state',
                    playerId: this.playerId,
                    gameState: {
                        snake: this.game.snake,
                        score: this.game.score,
                        alive: !this.game.gameOver
                    }
                });
            }
        }, 50);
    }

    startHeartbeat() {
        setInterval(() => {
            if (this.channel) {
                this.sendMessage({
                    type: 'heartbeat',
                    playerId: this.playerId,
                    timestamp: Date.now()
                });
            }
        }, 5000);
    }

    async sendGameOver(winner) {
        this.sendMessage({
            type: 'game_over',
            playerId: this.playerId,
            winner: winner
        });
        this.cleanup();
    }

    handleRoomClosed() {
        if (this.game.onRoomClosed) {
            this.game.onRoomClosed();
        }
        this.cleanup();
    }

    leaveRoom() {
        this.sendMessage({
            type: 'player_left',
            playerId: this.playerId
        });
        this.cleanup();
    }

    cleanup() {
        if (this.sendInterval) {
            clearInterval(this.sendInterval);
            this.sendInterval = null;
        }
        if (this.channel) {
            this.channel.close();
            this.channel = null;
        }
        
        localStorage.removeItem('mp_room_id');
        localStorage.removeItem('mp_player_id');
        
        this.roomId = null;
        this.playerId = null;
        this.opponentData = null;
        this.ready = false;
    }
}