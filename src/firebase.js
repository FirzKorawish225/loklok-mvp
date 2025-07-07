import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDmZTFI5EqYLgJVA54ghBW6fLRPHZpuq0U",
  authDomain: "loklok-mvp.firebaseapp.com",
  projectId: "loklok-mvp",
  storageBucket: "loklok-mvp.firebasestorage.app",
  messagingSenderId: "631649899368",
  appId: "1:631649899368:web:5337c6ccd001115c67bcdd",
  measurementId: "G-W6WX2DHRPL"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
