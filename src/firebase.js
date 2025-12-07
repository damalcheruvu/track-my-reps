import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDA7JElzU6qiRo7JInsyFOyCwV584gZ5Ag",
  authDomain: "track-my-reps.firebaseapp.com",
  projectId: "track-my-reps",
  storageBucket: "track-my-reps.firebasestorage.app",
  messagingSenderId: "164703762100",
  appId: "1:164703762100:web:1d75ecf0d08a101135c9e1",
  measurementId: "G-1RHC65C2N3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support persistence.');
  }
});
