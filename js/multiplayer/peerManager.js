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
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
    }

    // Инициализация Peer с разными серверами
    init(serverIndex = 0) {
        return new Promise((resolve, reject) => {
            const id = this.generateRoomCode();
            
            // Список альтернативных серверов PeerJS
            const servers = [
                // Вариант 1: официальный сервер (часто не работает)
                {
                    host: '0.peerjs.com',
                    port: 443,
                    secure: true,
                    path: '/'
                },
                // Вариант 2: альтернативный сервер
                {
                    host: 'peerjs-server.herokuapp.com',
                    port: 443,
                    secure: true
                },
                // Вариант 3: другой альтернативный сервер
                {
                    host: 'peerjs.herokuapp.com',
                    port: 443,
                    secure: true
                },
                // Вариант 4: публичный сервер (может быть медленным)
                {
                    host: 'peer-server.cyclic.app',
                    port: 443,
                    secure: true
                },
                // Вариант 5: без указания сервера (использует стандартный)
                {}
            ];
            
            const config = servers[serverIndex];
            console.log('Attempting to connect with server config:', config);
            
            try {
                if (Object.keys(config).length === 0) {
                    this.peer = new Peer(id);
                } else {
                    this.peer = new Peer(id, config);
                }
                
                // Таймаут на подключение
                const timeout = setTimeout(() => {
                    if (this.peer && !this.peer.open) {
                        console.log('Connection timeout, trying next server...');
                        this.peer.destroy();
                        if (serverIndex + 1 < servers.length) {
                            this.init(serverIndex + 1).then(resolve).catch(reject);
                        } else {
                            reject(new Error('All peer servers failed to connect'));
                        }
                    }
                }, 5000);
                
                this.peer.on('open', () => {
                    clearTimeout(timeout);
                    this.myId = this.peer.id;
                    console.log('Peer initialized, ID:', this.myId, 'with config:', config);
                    resolve(this.myId);
                });
                
                this.peer.on('error', (error) => {
                    clearTimeout(timeout);
                    console.error('Peer error with config', config, ':', error);
                    
                    if (serverIndex + 1 < servers.length) {
                        console.log('Trying next server...');
                        this.peer.destroy();
                        this.init(serverIndex + 1).then(resolve).catch(reject);
                    } else {
                        if (this.onError) this.onError(error);
                        reject(error);
                    }
                });
                
                this.peer.on('connection', (conn) => {
                    console.log('Incoming connection from:', conn.peer);
                    this.handleConnection(conn);
                });
                
            } catch (error) {
                console.error('Failed to create peer:', error);
                if (serverIndex + 1 < servers.length) {
                    this.init(serverIndex + 1).then(resolve).catch(reject);
                } else {
                    reject(error);
                }
            }
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
        
        if (!this.peer || this.peer.destroyed) {
            return Promise.reject(new Error('Peer not initialized'));
        }
        
        const conn = this.peer.connect(roomCode, {
            reliable: true
        });
        
        this.handleConnection(conn);
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 15000);
            
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
            
            // Отправляем приветственное сообщение
            this.sendMessage({
                type: 'handshake',
                timestamp: Date.now(),
                isHost: this.isHost
            });
            
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
            try {
                this.connection.send(message);
                return true;
            } catch (error) {
                console.error('Failed to send message:', error);
                return false;
            }
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
            this.connection = null;
        }
        if (this.peer && !this.peer.destroyed) {
            this.peer.destroy();
            this.peer = null;
        }
        this.isHost = false;
        this.myId = null;
        this.opponentId = null;
    }
}
