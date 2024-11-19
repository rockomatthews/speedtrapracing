import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Handle both session cookie and ID token verification
    const { sessionCookie, idToken } = body;
    
    console.log('📝 Verify endpoint received request:', { 
      hasSessionCookie: !!sessionCookie, 
      hasIdToken: !!idToken 
    });

    let decodedClaims;
    
    if (sessionCookie) {
      // Verify session cookie
      console.log('🔍 Verifying session cookie...');
      decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    } else if (idToken) {
      // Verify ID token
      console.log('🔍 Verifying ID token...');
      decodedClaims = await adminAuth.verifyIdToken(idToken);
    } else {
      console.log('❌ No token provided');
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
    }

    console.log('✅ Token verified for UID:', decodedClaims.uid);

    // Get user data from Firestore
    const userDoc = await adminDb.collection('Users').doc(decodedClaims.uid).get();
    console.log('📋 User document exists:', userDoc.exists);
    
    if (!userDoc.exists) {
      console.log('❌ User document not found');
      return NextResponse.json({ error: 'User not found' }, { status: 403 });
    }

    const userData = userDoc.data();
    console.log('👤 User admin status:', userData.isAdmin);
    
    if (!userData.isAdmin) {
      console.log('🚫 User is not an admin');
      return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
    }

    // If ID token was provided, create a session cookie
    let sessionToken;
    if (idToken) {
      console.log('🔑 Creating new session cookie');
      sessionToken = await adminAuth.createSessionCookie(idToken, { 
        expiresIn: 60 * 60 * 24 * 5 * 1000 // 5 days
      });
    }

    const response = NextResponse.json({
      status: 'success',
      uid: decodedClaims.uid,
      email: userData.email,
      isAdmin: true
    });

    // Set session cookie if we created one
    if (sessionToken) {
      response.cookies.set('session', sessionToken, {
        maxAge: 60 * 60 * 24 * 5, // 5 days in seconds
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error('🚨 Verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}