// src/middleware.js
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
const apps = getApps();
if (!apps.length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

export async function middleware(request) {
  // Only check auth for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    try {
      // Get the session cookie
      const sessionCookie = request.cookies.get('session')?.value;

      if (!sessionCookie) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Verify the session
      const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);

      // Get user data from Firestore to check admin status
      const adminDoc = await db.collection('Users').doc(decodedClaims.uid).get();
      
      if (!adminDoc.exists || !adminDoc.data().isAdmin) {
        return new NextResponse('Forbidden', {
          status: 403,
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      }

      // Add user info to request headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decodedClaims.uid);
      requestHeaders.set('x-user-role', 'admin');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      
    } catch (error) {
      console.error('Admin middleware error:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};