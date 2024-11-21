import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request) {
    try {
        const body = await request.json();
        const { sessionCookie, idToken } = body;
        
        // Get cookie from request if not provided in body
        const cookieStore = cookies();
        const sessionCookieFromRequest = cookieStore.get('adminSession')?.value;

        console.log('📝 Verify endpoint received request:', {
            hasSessionCookie: !!(sessionCookie || sessionCookieFromRequest),
            hasIdToken: !!idToken
        });

        let uid;
        let decodedClaim;
        
        // Try session cookie first (from body or request)
        const cookieToVerify = sessionCookie || sessionCookieFromRequest;
        if (cookieToVerify) {
            console.log('🔍 Verifying session cookie...');
            try {
                decodedClaim = await adminAuth.verifySessionCookie(cookieToVerify, true);
                uid = decodedClaim.uid;
                console.log('✅ Token verified for UID:', uid);
            } catch (cookieError) {
                console.log('❌ Session cookie verification failed:', cookieError.message);
                // If cookie verification fails, try ID token next
            }
        }
        
        // If cookie verification failed, try ID token
        if (!uid && idToken) {
            console.log('🔍 Verifying ID token...');
            const decodedToken = await adminAuth.verifyIdToken(idToken);
            uid = decodedToken.uid;
            console.log('✅ Token verified for UID:', uid);

            // Create a new session cookie
            console.log('🔑 Creating new session cookie');
            const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
            const newSessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
            
            // Set the cookie in the response
            const response = NextResponse.json({
                status: 'success',
                uid: uid,
                email: decodedToken.email,
                isAdmin: true // Will be verified below
            });

            response.cookies.set('adminSession', newSessionCookie, {
                maxAge: expiresIn,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });

            return response;
        }

        if (!uid) {
            throw new Error('No valid authentication token provided');
        }

        // Verify admin status
        const userDoc = await adminDb.collection('Users').doc(uid).get();
        console.log('📋 User document exists:', userDoc.exists);
        
        if (!userDoc.exists) {
            throw new Error('User document not found');
        }

        const userData = userDoc.data();
        console.log('👤 User admin status:', userData.isAdmin);

        if (!userData.isAdmin) {
            throw new Error('User is not an admin');
        }

        // Return success response
        return NextResponse.json({
            status: 'success',
            uid: uid,
            email: userData.email,
            isAdmin: true
        });

    } catch (error) {
        console.error('❌ Verification error:', error);
        return NextResponse.json(
            { 
                status: 'error', 
                message: 'Session verification failed',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 401 }
        );
    }
}