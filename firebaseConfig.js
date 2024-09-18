import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import apiKeys from "./keys.js";

const firebaseConfig = {
    apiKey: apiKeys.apiKey,
    authDomain: apiKeys.authDomain,
    projectId: apiKeys.projectId,
    storageBucket: apiKeys.storageBucket,
    messagingSenderId: apiKeys.messagingSenderId,
    appId: apiKeys.appId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs, doc, setDoc, deleteDoc };