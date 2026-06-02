// peerManager.js - мультиплеер через Firebase
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
        this.unsubscribe = null;
        this.roomRef = null;
        this.connected = false;
    }

    async init() {
        return "firebase-ready";
    }

    createRoom() {
        this.isHost = true;
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();
        this.setupRoom();
        return this.roomId;
    }

    async joinRoom(roomCode) {
        this.isHost = false;
        this.roomId = roomCode;
        
        const roomRef = doc(db, "gameRooms", this.roomId);
        const roomSnap = await getDoc(roomRef);
        
        if (!roomSnap.exists()) throw new Error("Room not found");
        if (roomSnap.data().players >= 2) throw new Error("Room is full");
        
        await this.setupRoom();
    }

    async setupRoom() {
        this.roomRef = doc(db, "gameRooms", this.roomId);
        
        if (this.isHost) {
            await setDoc(this.roomRef, {
                players: 1,
                createdAt: Date.now(),
                gameData: null,
                hostReady: false,
                clientReady: false
            });
        } else {
            await updateDoc(this.roomRef, { players: 2 });
        }
        
        this.unsubscribe = onSnapshot(this.roomRef, (snapshot) => {
            if (!snapshot.exists()) {
                if (this.onOpponentDisconnect) this.onOpponentDisconnect();
                return;
            }
            
            const data = snapshot.data();
            
            if (data.gameData && this.onDataReceived) {
                this.onDataReceived(data.gameData);
                if (!this.isHost) {
                    updateDoc(this.roomRef, { gameData: null });
                }
            }
            
            if (this.isHost && data.clientReady) {
                if (this.onConnectionOpen) this.onConnectionOpen(true);
            } else if (!this.isHost && data.hostReady) {
                if (this.onConnectionOpen) this.onConnectionOpen(false);
            }
        });
        
        if (this.isHost) {
            await updateDoc(this.roomRef, { hostReady: true });
        } else {
            await updateDoc(this.roomRef, { clientReady: true });
        }
        
        this.connected = true;
    }

    async sendMessage(message) {
        if (!this.roomRef) return false;
        try {
            await updateDoc(this.roomRef, { gameData: message });
            return true;
        } catch (error) {
            return false;
        }
    }

    isConnected() {
        return this.connected;
    }

    async disconnect() {
        if (this.unsubscribe) this.unsubscribe();
        if (this.roomRef) {
            try { await deleteDoc(this.roomRef); } catch(e) {}
        }
        this.connected = false;
        this.roomId = null;
        this.roomRef = null;
    }
}
