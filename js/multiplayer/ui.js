// ui.js
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
        this.panel = null;
    }

    createUI() {
        this.isActive = true;
        this.game.currentScreen = "MULTIPLAYER";
        this.game.isPaused = true;
        this.createPanel();
    }

    createPanel() {
        if (this.panel) {
            this.panel.remove();
        }
        
        this.panel = document.createElement('div');
        this.panel.id = 'multiplayer-panel';
        this.panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 280px;
            background: #1a1c1e;
            border: 3px solid #fff;
            border-radius: 10px;
            padding: 20px;
            z-index: 10000;
            text-align: center;
            font-family: 'Press Start 2P', monospace;
        `;
        
        this.panel.innerHTML = `
            <div style="color: #8bac0f; font-size: 12px; margin-bottom: 15px;">MULTIPLAYER</div>
            <div id="mp-status" style="color: #58a6ff; font-size: 8px; margin-bottom: 15px;">${this.status}</div>
            <div id="mp-room" style="color: #fff; font-size: 20px; letter-spacing: 3px; margin-bottom: 15px;">${this.roomCode || ''}</div>
            <button id="mp-create" style="width: 100%; background: #4a90e2; color: #fff; border: none; padding: 12px; font-family: inherit; font-size: 10px; margin-bottom: 10px; border-radius: 5px;">CREATE ROOM</button>
            <input type="text" id="mp-input" placeholder="6-DIGIT CODE" maxlength="6" style="width: 100%; background: #fff; color: #000; border: none; padding: 12px; font-family: monospace; font-size: 16px; text-align: center; margin-bottom: 10px; border-radius: 5px; box-sizing: border-box;">
            <button id="mp-join" style="width: 100%; background: #7ed321; color: #fff; border: none; padding: 12px; font-family: inherit; font-size: 10px; margin-bottom: 10px; border-radius: 5px;">JOIN ROOM</button>
            <button id="mp-back" style="width: 100%; background: #ff5c5c; color: #fff; border: none; padding: 12px; font-family: inherit; font-size: 10px; border-radius: 5px;">BACK</button>
        `;
        
        document.body.appendChild(this.panel);
        
        const createBtn = document.getElementById('mp-create');
        const joinBtn = document.getElementById('mp-join');
        const backBtn = document.getElementById('mp-back');
        const codeInput = document.getElementById('mp-input');
        
        createBtn.onclick = () => this.createRoom();
        joinBtn.onclick = () => {
            const code = codeInput.value.trim();
            if (code.length === 6) {
                this.joinRoom(code);
            } else {
                alert('Enter 6-digit code!');
            }
        };
        backBtn.onclick = () => {
            this.close(true);
            this.game.currentScreen = "MAIN";
        };
        
        this.statusDiv = document.getElementById('mp-status');
        this.roomDiv = document.getElementById('mp-room');
        this.codeInput = codeInput;
    }
    
    updateUI() {
        if (this.statusDiv) this.statusDiv.textContent = this.status;
        if (this.roomDiv) this.roomDiv.textContent = this.roomCode || '';
    }

    async createRoom() {
        this.isConnecting = true;
        this.status = "Creating room...";
        this.updateUI();
        
        try {
            await this.peerManager.init();
            this.roomCode = this.peerManager.createRoom();
            this.isHost = true;
            this.status = "Waiting for opponent...";
            this.updateUI();
            
            alert("Your room code: " + this.roomCode);
            
            this.peerManager.onConnectionOpen = () => {
                console.log("onConnectionOpen received, starting game...");
                this.startGame();
            };
            
            this.peerManager.onOpponentDisconnect = () => {
                this.status = "Opponent disconnected!";
                this.updateUI();
                setTimeout(() => {
                    if (this.isActive) this.close(true);
                }, 2000);
            };
            
        } catch (error) {
            this.status = "Failed to create room!";
            this.updateUI();
            console.error(error);
        }
        this.isConnecting = false;
    }

    async joinRoom(roomCode) {
        this.isConnecting = true;
        this.status = "Connecting...";
        this.updateUI();
        
        try {
            await this.peerManager.init();
            await this.peerManager.joinRoom(roomCode);
            this.roomCode = roomCode;
            this.isHost = false;
            this.status = "Connected! Waiting for host...";
            this.updateUI();
            
            this.peerManager.onConnectionOpen = () => {
                console.log("onConnectionOpen received, starting game...");
                this.startGame();
            };
            
            this.peerManager.onOpponentDisconnect = () => {
                this.status = "Opponent disconnected!";
                this.updateUI();
                setTimeout(() => {
                    if (this.isActive) this.close(true);
                }, 2000);
            };
            
        } catch (error) {
            this.status = "Failed to join!";
            this.updateUI();
            alert("Failed to join room. Check code!");
            console.error(error);
        }
        this.isConnecting = false;
    }

    startGame() {
        console.log("UI startGame called, isHost:", this.isHost);
        this.close(false);
        this.game.startMultiplayerMode(this.multiplayerGame);
        this.multiplayerGame.init(this.isHost);
        console.log("Game should be running now");
    }

    close(disconnect = false) {
        console.log("Closing UI, disconnect:", disconnect);
        this.isActive = false;
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        if (disconnect && this.peerManager) {
            this.peerManager.disconnect();
        }
        this.roomCode = null;
        this.isConnecting = false;
    }
}
