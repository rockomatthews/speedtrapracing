// api/auth/verify/route.js

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function POST(request) {
    console.log('🔍 Verify endpoint starting...', {
        env: process.env.NODE_ENV,
        url: request.url
    });

    try {
        const cookieStore = cookies();
        const sessionCookie = cookieStore.get('adminSession')?.value;
        const body = await request.json().catch(() => ({}));
        const { idToken } = body;

        console.log('📝 Auth tokens:', {
            requestSessionCookie: sessionCookie ? 'present' : 'missing',
            idToken: idToken ? 'present' : 'missing'
        });

        // Try session cookie first
        if (sessionCookie) {
            try {
                const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
                console.log('✅ Session cookie verified for UID:', decodedClaims.uid);

                // Get user data from Firestore
                const userDoc = await adminDb.collection('Users').doc(decodedClaims.uid).get();
                
                if (!userDoc.exists) {
                    throw new Error('User document not found');
                }

                return NextResponse.json({
                    status: 'success',
                    isAdmin: decodedClaims.admin === true,
                    uid: decodedClaims.uid,
                    email: decodedClaims.email,
                    userData: userDoc.data()
                });
            } catch (error) {
                console.error('❌ Session verification error:', error);
                // Continue to try ID token if session cookie fails
            }
        }

        // If we get here, either there was no session cookie or it failed verification
        if (!idToken) {
            return NextResponse.json({
                status: 'error',
                message: 'No valid authentication provided'
            }, { status: 401 });
        }

        // Verify ID token
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        console.log('✅ ID token verified for UID:', decodedToken.uid);

        // Get user data
        const userDoc = await adminDb.collection('Users').doc(decodedToken.uid).get();
        
        if (!userDoc.exists) {
            throw new Error('User document not found');
        }

        return NextResponse.json({
            status: 'success',
            isAdmin: decodedToken.admin === true,
            uid: decodedToken.uid,
            email: decodedToken.email,
            userData: userDoc.data()
        });

    } catch (error) {
        console.error('❌ Database error:', error);
        return NextResponse.json({
            status: 'error',
            message: 'Database error'
        }, { status: 500 });
    }
}