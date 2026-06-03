import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    where,
    updateDoc,
    deleteDoc,
    onSnapshot,
    doc,
    setDoc,
    enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCiTAsiUVnWwT4DfIi70wvYwuVJnYqoK20",
    authDomain: "retro-snake-94402.firebaseapp.com",
    projectId: "retro-snake-94402",
    storageBucket: "retro-snake-94402.firebasestorage.app",
    messagingSenderId: "176962387007",
    appId: "1:176962387007:web:15abe95b45d9f6f9a54c8a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Включаем persistence для лучшей работы
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
    } else if (err.code === 'unimplemented') {
        console.warn("The current browser doesn't support persistence.");
    }
});

export { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    where,
    updateDoc,
    deleteDoc,
    onSnapshot,
    doc,
    setDoc
};
