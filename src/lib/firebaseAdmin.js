// src/lib/firebaseAdmin.js
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Create service account config from individual environment variables
const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL
};

// Validate required fields
if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
    throw new Error('Missing required Firebase Admin environment variables');
}

// Initialize Firebase Admin if it hasn't been initialized yet
if (!getApps().length) {
    try {
        initializeApp({
            credential: cert(serviceAccount)
        });
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
        throw error;
    }
}

// Get Auth instance
const adminAuth = getAuth();

// Get Firestore instance
const adminDb = getFirestore();

// Export both instances
export { adminAuth, adminDb };