import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDmZTFI5EqYLgJVA54ghBW6fLRPHZpuq0U",
  authDomain: "loklok-mvp.firebaseapp.com",
  projectId: "loklok-mvp",
  storageBucket: "loklok-mvp.firebasestorage.app",
  messagingSenderId: "631649899368",
  appId: "1:631649899368:web:5337c6ccd001115c67bcdd",
  measurementId: "G-W6WX2DHRPL"
};

// Init Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);   // 👈 เพิ่มบรรทัดนี้

export default app;