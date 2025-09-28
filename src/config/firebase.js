// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Replace these values with your actual config from Firebase Console
// Import the functions you need from the SDKs you need
const firebaseConfig = {
  apiKey: "AIzaSyDb8kLpAomqg6eoSbYFuJtrT8c9K7yCE00",
  authDomain: "training-leaderboard.firebaseapp.com",
  projectId: "training-leaderboard",
  storageBucket: "training-leaderboard.firebasestorage.app",
  messagingSenderId: "169851784977",
  appId: "1:169851784977:web:00e4549c942a5e2e5e86b0",
  measurementId: "G-FB06GM6H5P"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
