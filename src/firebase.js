// Import des fonctions Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Votre configuration Firebase (celle que vous venez de créer)
const firebaseConfig = {
  apiKey: "AIzaSyATMTwMI-7nk1GUbrCG6q7Bu61S5x27LFw",
  authDomain: "avibiotech-platform.firebaseapp.com",
  projectId: "avibiotech-platform",
  storageBucket: "avibiotech-platform.firebasestorage.app",
  messagingSenderId: "70599779092",
  appId: "1:70599779092:web:afdec5d9bbc8c724ba1801"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser les services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Exporter pour les utiliser dans l'application
export { db, auth, storage };