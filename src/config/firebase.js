import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app;
let db;
let auth;
let analytics;

if (firebaseConfig?.projectId) {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  if (app.name && typeof window !== 'undefined') {
    db = getFirestore(app);
    auth = getAuth(app);
    
    // Only initialize analytics if window is defined (client-side)
    if ('measurementId' in firebaseConfig) {
      analytics = getAnalytics(app);
    }
  }
}

export { app, auth, db, analytics };