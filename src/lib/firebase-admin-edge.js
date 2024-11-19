import * as firebaseAdmin from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin for Edge Runtime
const initializeFirebaseAdmin = () => {
  if (!firebaseAdmin.getApps().length) {
    try {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${process.env.FIREBASE_ADMIN_PROJECT_ID}.firebaseio.com`
      });
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
    }
  }
  return firebaseAdmin.getApps()[0];
};

const app = initializeFirebaseAdmin();
const auth = getAuth(app);
const db = getFirestore(app);

export { auth as adminAuth, db as adminDb };