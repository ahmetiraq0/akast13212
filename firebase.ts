import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCR0kAxpxZdv9jg36r43KmFK8x1hFJrN74",
  authDomain: "aksat-dfa22.firebaseapp.com",
  projectId: "aksat-dfa22",
  storageBucket: "aksat-dfa22.firebasestorage.app",
  messagingSenderId: "531105302253",
  appId: "1:531105302253:web:93bfffb123d9c5c9d5eee4",
  measurementId: "G-SYGY5XNDWL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
