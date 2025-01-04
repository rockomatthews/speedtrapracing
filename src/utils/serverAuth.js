import { adminAuth } from '../config/firebaseAdmin';

export async function verifyIdToken(token) {
  try {
    console.log('Verifying ID token on server...');
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims || {};

    return {
      ...decodedToken,
      isAdmin: customClaims.admin === true
    };
  } catch (error) {
    console.error('Server token verification error:', error);
    throw error;
  }
} 