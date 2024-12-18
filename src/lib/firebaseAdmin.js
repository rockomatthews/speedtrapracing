// src/lib/firebaseAdmin.js
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Parse the service account JSON from environment variable
const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
);

// Initialize Firebase Admin if it hasn't been initialized yet
if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
        // You can add other config options here if needed, such as:
        // databaseURL: process.env.FIREBASE_DATABASE_URL,
        // storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
}

// Get Auth instance
const adminAuth = getAuth();

// Get Firestore instance
const adminDb = getFirestore();

// Export both instances
export { adminAuth, adminDb };