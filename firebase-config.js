import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, where } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCiTAsiUVnWwT4DfIi70wvYwuVJnYqoK20",
    authDomain: "retro-snake-94402.firebaseapp.com",
    projectId: "retro-snake-94402",
    storageBucket: "retro-snake-94402.firebasestorage.app",
    messagingSenderId: "176962387007",
    appId: "1:176962387007:web:15abe95b45d9f6f9a54c8a"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Экспортируем БД и методы
export { db, collection, addDoc, query, orderBy, limit, getDocs, where };
