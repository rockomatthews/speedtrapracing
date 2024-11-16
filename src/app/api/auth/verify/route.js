// src/app/api/auth/verify/route.js
const { adminAuth, adminDb } = require('@/lib/firebaseAdmin');

export async function POST(request) {
  try {
    const { sessionCookie } = await request.json();

    if (!sessionCookie) {
      return Response.json({ error: 'No session cookie provided' }, { status: 401 });
    }

    // Verify the session
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    // Get user data from Firestore to check admin status
    const adminDoc = await adminDb.collection('Users').doc(decodedClaims.uid).get();
    
    if (!adminDoc.exists || !adminDoc.data().isAdmin) {
      return Response.json({ error: 'Not an admin' }, { status: 403 });
    }

    return Response.json({
      uid: decodedClaims.uid,
      isAdmin: true
    });

  } catch (error) {
    console.error('Session verification error:', error);
    return Response.json({ error: 'Invalid session' }, { status: 401 });
  }
}