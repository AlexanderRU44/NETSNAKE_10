// peerManager.js - исправленный
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

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
        this.roomRef = null;
        this.connected = false;
        this.gameStarted = false;
    }

    async init() {
        console.log("Firebase initialized");
        return "firebase-ready";
    }

    async createRoom() {
        this.isHost = true;
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();
        
        console.log("Creating room:", this.roomId);
        
        try {
            const roomRef = doc(db, "gameRooms", this.roomId);
            await setDoc(roomRef, {
                players: 1,
                createdAt: Date.now(),
                gameData: null,
                hostReady: false,
                clientReady: false,
                gameStarted: false
            });
            console.log("Room created successfully");
            this.setupRoom(roomRef);
            return this.roomId;
        } catch (error) {
            console.error("Create room error:", error);
            throw error;
        }
    }

    async joinRoom(roomCode) {
        this.isHost = false;
        this.roomId = roomCode;
        
        console.log("Joining room:", roomCode);
        
        try {
            const roomRef = doc(db, "gameRooms", this.roomId);
            const roomSnap = await getDoc(roomRef);
            
            if (!roomSnap.exists()) {
                throw new Error("Room not found");
            }
            
            const roomData = roomSnap.data();
            if (roomData.players >= 2) {
                throw new Error("Room is full");
            }
            
            await updateDoc(roomRef, { players: 2 });
            console.log("Joined room successfully");
            this.setupRoom(roomRef);
        } catch (error) {
            console.error("Join room error:", error);
            throw error;
        }
    }

    setupRoom(roomRef) {
        this.roomRef = roomRef;
        
        this.unsubscribe = onSnapshot(roomRef, async (snapshot) => {
            if (!snapshot.exists()) {
                console.log("Room deleted");
                if (this.onOpponentDisconnect) this.onOpponentDisconnect();
                return;
            }
            
            const data = snapshot.data();
            console.log("Room update:", data);
            
            // Получаем игровые данные
            if (data.gameData && this.onDataReceived) {
                console.log("Received game data");
                this.onDataReceived(data.gameData);
                if (!this.isHost) {
                    await updateDoc(roomRef, { gameData: null });
                }
            }
            
            // КОГДА ОБА ГОТОВЫ - ЗАПУСКАЕМ ИГРУ
            if (data.hostReady && data.clientReady && !data.gameStarted) {
                console.log("BOTH PLAYERS READY! STARTING GAME!");
                await updateDoc(roomRef, { gameStarted: true });
                
                // ВАЖНО: вызываем onConnectionOpen для обоих игроков
                if (this.onConnectionOpen) {
                    console.log("Calling onConnectionOpen with isHost:", this.isHost);
                    this.onConnectionOpen(this.isHost);
                }
            }
        }, (error) => {
            console.error("Snapshot error:", error);
            if (this.onError) this.onError(error);
        });
        
        // Отправляем сигнал готовности
        const readyField = this.isHost ? 'hostReady' : 'clientReady';
        updateDoc(roomRef, { [readyField]: true }).catch(err => console.error("Ready update error:", err));
        
        this.connected = true;
    }

    async sendMessage(message) {
        if (!this.roomRef) {
            console.log("No room reference");
            return false;
        }
        
        try {
            await updateDoc(this.roomRef, { gameData: message });
            console.log("Message sent");
            return true;
        } catch (error) {
            console.error("Send message error:", error);
            return false;
        }
    }

    isConnected() {
        return this.connected && this.roomRef !== null;
    }

    async disconnect() {
        console.log("Disconnecting...");
        
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        
        if (this.roomRef) {
            try {
                await deleteDoc(this.roomRef);
                console.log("Room deleted");
            } catch(e) {
                console.log("Could not delete room:", e);
            }
            this.roomRef = null;
        }
        
        this.connected = false;
        this.roomId = null;
        this.isHost = false;
        this.gameStarted = false;
    }
}
