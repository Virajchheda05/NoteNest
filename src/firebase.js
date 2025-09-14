// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDOZCGuhSfOB7JTwWUYGqFze2wj6JwSmE4",
  authDomain: "notenest-51a25.firebaseapp.com",
  projectId: "notenest-51a25",
  storageBucket: "notenest-51a25.firebasestorage.app",
  messagingSenderId: "926471199154",
  appId: "1:926471199154:web:f4234555489d47dc02acab"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;