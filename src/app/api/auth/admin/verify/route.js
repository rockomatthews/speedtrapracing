// /api/auth/admin/verify/route.js

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/config/firebaseAdmin';
import { cookies } from 'next/headers';

export async function POST(request) {
    console.log('Starting admin verification...', {
        environment: process.env.NODE_ENV,
        origin: request.headers.get('origin')
    });

    // Add CORS headers for production
    if (process.env.NODE_ENV === 'production') {
        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Origin', 'https://speedtrapracing.com');
    }

    try {
        const body = await request.json();
        const { idToken, sessionCookie } = body;
        const cookieStore = cookies();
        const existingSession = cookieStore.get('adminSession')?.value;

        let decodedToken;
        let uid;

        // First try existing session if available
        if (existingSession) {
            try {
                decodedToken = await adminAuth.verifySessionCookie(existingSession, true);
                uid = decodedToken.uid;
                console.log('Existing session verified for:', uid);
            } catch (error) {
                console.log('Existing session invalid:', error.message);
            }
        }

        // Then try the ID token if no valid session
        if (!uid && idToken) {
            try {
                decodedToken = await adminAuth.verifyIdToken(idToken);
                uid = decodedToken.uid;
                console.log('ID token verified for:', uid);

                // Create new session cookie
                const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
                const newSessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

                // Get user data and verify admin status
                const userDoc = await adminDb.collection('Users').doc(uid).get();
                if (!userDoc.exists || !userDoc.data().isAdmin) {
                    return NextResponse.json({ 
                        status: 'error',
                        message: 'Not authorized as admin'
                    }, { status: 403 });
                }

                // Create success response with new session cookie
                const response = NextResponse.json({
                    status: 'success',
                    isAdmin: true,
                    uid: uid,
                    email: userDoc.data().email
                });

                // Set the session cookie
                response.cookies.set('adminSession', newSessionCookie, {
                    maxAge: expiresIn,
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Changed this
                    path: '/',
                    domain: process.env.NODE_ENV === 'production' 
                        ? '.speedtrapracing.com'  // Add the dot prefix for all subdomains
                        : 'localhost'
                });

                return response;
            } catch (error) {
                console.error('ID token verification failed:', error);
                return NextResponse.json({ 
                    status: 'error',
                    message: 'Invalid authentication'
                }, { status: 401 });
            }
        }

        if (!uid) {
            return NextResponse.json({ 
                status: 'error',
                message: 'No valid authentication provided'
            }, { status: 401 });
        }

        // Verify admin status for existing session
        const userDoc = await adminDb.collection('Users').doc(uid).get();
        if (!userDoc.exists || !userDoc.data().isAdmin) {
            return NextResponse.json({ 
                status: 'error',
                message: 'Not authorized as admin'
            }, { status: 403 });
        }

        return NextResponse.json({
            status: 'success',
            isAdmin: true,
            uid: uid,
            email: userDoc.data().email
        });

    } catch (error) {
        console.error('Admin verification error:', error);
        return NextResponse.json({ 
            status: 'error',
            message: 'Verification failed'
        }, { status: 401 });
    }
}