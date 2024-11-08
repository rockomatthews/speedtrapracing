const { initializeApp, getApps } = require("firebase/app");
const { getAnalytics } = require("firebase/analytics");
const { getFirestore } = require('firebase/firestore');
const { getAuth } = require("firebase/auth");
const { getStorage } = require("firebase/storage");

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
let storage;

if (!getApps().length && firebaseConfig?.projectId) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    
    if (typeof window !== 'undefined' && 'measurementId' in firebaseConfig) {
      analytics = getAnalytics(app);
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

module.exports = { app, auth, db, analytics, storage };