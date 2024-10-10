// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAs9Rl_ZO7avzPfBWgrRPzQ-fOLHFYVGl0",
  authDomain: "speedtrapracing-aa7c8.firebaseapp.com",
  projectId: "speedtrapracing-aa7c8",
  storageBucket: "speedtrapracing-aa7c8.appspot.com",
  messagingSenderId: "583692035652",
  appId: "1:583692035652:web:7dd8e0e066a0db79763e11",
  measurementId: "G-TRL59427PM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export {app, db};