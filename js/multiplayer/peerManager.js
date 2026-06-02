// peerManager.js - управление мультиплеером через Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// Firebase конфигурация (ваша существующая)
const firebaseConfig = {
    apiKey: "AIzaSyCiTAsiUVnWwT4DfIi70wvYwuVJnYqoK20",
    authDomain: "retro-snake-94402.firebaseapp.com",
    projectId: "retro-snake-94402",
    storageBucket: "retro-snake-94402.firebasestorage.app",
    messagingSenderId: "176962387007",
    appId: "1:176962387007:web:15abe95b45d9f6f9a54c8a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export class PeerManager {
    constructor() {
        this.roomId = null;
        this.isHost = false;
        this.onDataReceived = null;
        this.onConnectionOpen = null;
        this.onOpponentDisconnect = null;
        this.onError = null;
        this.unsubscribe = null;
        this.gameStateRef = null;
        this.connected = false;
    }

    // Инициализация (для Firebase не нужна)
    init() {
        return Promise.resolve("firebase-ready");
    }

    // Создание комнаты (хост)
    createRoom() {
        this.isHost = true;
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();
        this.setupRoom();
        return this.roomId;
    }

    // Подключение к комнате (клиент)
    async joinRoom(roomCode) {
        this.isHost = false;
        this.roomId = roomCode;
        
        // Проверяем существует ли комната
        const roomRef = doc(db, "gameRooms", this.roomId);
        const roomSnap = await getDoc(roomRef);
        
        if (!roomSnap.exists()) {
            throw new Error("Room not found");
        }
        
        const roomData = roomSnap.data();
        if (roomData.players >= 2) {
            throw new Error("Room is full");
        }
        
        // Подключаемся к комнате
        await this.setupRoom();
        return true;
    }

    async setupRoom() {
        const roomRef = doc(db, "gameRooms", this.roomId);
        
        if (this.isHost) {
            // Хост создаёт комнату
            await setDoc(roomRef, {
                players: 1,
                hostId: "host",
                createdAt: Date.now(),
                gameData: null,
                player1Ready: false,
                player2Ready: false
            });
        } else {
            // Клиент подключается
            await updateDoc(roomRef, {
                players: 2
            });
        }
        
        // Слушаем изменения в комнате
        this.unsubscribe = onSnapshot(roomRef, (snapshot) => {
            if (!snapshot.exists()) {
                if (this.onOpponentDisconnect) this.onOpponentDisconnect();
                return;
            }
            
            const data = snapshot.data();
            
            // Проверка отключения оппонента
            if (data.players < 2 && !this.isHost && this.connected) {
                if (this.onOpponentDisconnect) this.onOpponentDisconnect();
                this.connected = false;
            }
            
            // Получаем игровые данные
            if (data.gameData && this.onDataReceived) {
                this.onDataReceived(data.gameData);
                // Очищаем после получения
                if (!this.isHost) {
                    updateDoc(roomRef, { gameData: null });
                }
            }
            
            // Проверка готовности
            if (this.isHost && data.player2Ready) {
                if (this.onConnectionOpen) this.onConnectionOpen(true);
            } else if (!this.isHost && data.player1Ready) {
                if (this.onConnectionOpen) this.onConnectionOpen(false);
            }
        });
        
        // Если хост, помечаем себя готовым
        if (this.isHost) {
            await updateDoc(roomRef, { player1Ready: true });
        } else {
            await updateDoc(roomRef, { player2Ready: true });
        }
        
        this.connected = true;
        this.gameStateRef = roomRef;
    }

    // Отправка сообщения
    async sendMessage(message) {
        if (!this.gameStateRef) return false;
        
        try {
            await updateDoc(this.gameStateRef, {
                gameData: message,
                lastUpdate: Date.now()
            });
            return true;
        } catch (error) {
            console.error("Send message error:", error);
            return false;
        }
    }

    // Проверка соединения
    isConnected() {
        return this.connected;
    }

    // Отключение
    async disconnect() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        
        if (this.gameStateRef) {
            try {
                await deleteDoc(this.gameStateRef);
            } catch(e) {}
        }
        
        this.connected = false;
        this.roomId = null;
        this.isHost = false;
        this.gameStateRef = null;
    }
}
