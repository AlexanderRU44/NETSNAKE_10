// peerManager.js - управление Peer-to-Peer соединением
export class PeerManager {
    constructor() {
        this.peer = null;
        this.connection = null;
        this.myId = null;
        this.opponentId = null;
        this.isHost = false;
        this.onDataReceived = null;
        this.onConnectionOpen = null;
        this.onOpponentDisconnect = null;
        this.onError = null;
    }

    // Инициализация Peer
    init() {
        return new Promise((resolve, reject) => {
            // Генерируем случайный ID
            const id = this.generateRoomCode();
            this.peer = new Peer(id, {
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });
            
            this.peer.on('open', () => {
                this.myId = this.peer.id;
                console.log('Peer initialized, ID:', this.myId);
                resolve(this.myId);
            });
            
            this.peer.on('error', (error) => {
                console.error('Peer error:', error);
                if (this.onError) this.onError(error);
                reject(error);
            });
            
            this.peer.on('connection', (conn) => {
                console.log('Incoming connection from:', conn.peer);
                this.handleConnection(conn);
            });
        });
    }

    // Создание комнаты (хост)
    createRoom() {
        this.isHost = true;
        return this.myId;
    }

    // Подключение к комнате (клиент)
    joinRoom(roomCode) {
        this.isHost = false;
        this.opponentId = roomCode;
        
        const conn = this.peer.connect(roomCode);
        this.handleConnection(conn);
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 10000);
            
            const checkConnection = setInterval(() => {
                if (this.connection && this.connection.open) {
                    clearTimeout(timeout);
                    clearInterval(checkConnection);
                    resolve();
                }
            }, 100);
        });
    }

    // Обработка соединения
    handleConnection(conn) {
        this.connection = conn;
        this.opponentId = conn.peer;
        
        conn.on('open', () => {
            console.log('Connection established with:', this.opponentId);
            
            // Если мы хост, отправляем подтверждение
            if (this.isHost) {
                this.sendMessage({
                    type: 'hostReady',
                    timestamp: Date.now()
                });
            }
            
            if (this.onConnectionOpen) {
                this.onConnectionOpen(this.isHost);
            }
        });
        
        conn.on('data', (data) => {
            if (this.onDataReceived) {
                this.onDataReceived(data);
            }
        });
        
        conn.on('close', () => {
            console.log('Connection closed');
            if (this.onOpponentDisconnect) {
                this.onOpponentDisconnect();
            }
        });
        
        conn.on('error', (error) => {
            console.error('Connection error:', error);
            if (this.onError) this.onError(error);
        });
    }

    // Отправка сообщения
    sendMessage(message) {
        if (this.connection && this.connection.open) {
            this.connection.send(message);
            return true;
        }
        return false;
    }

    // Проверка соединения
    isConnected() {
        return this.connection && this.connection.open;
    }

    // Генерация кода комнаты (6 цифр)
    generateRoomCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Отключение
    disconnect() {
        if (this.connection) {
            this.connection.close();
        }
        if (this.peer) {
            this.peer.destroy();
        }
    }
}