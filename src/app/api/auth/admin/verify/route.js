// /api/auth/admin/verify/route.js

import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export async function POST(request) {
    console.log('Admin verification request received');

    try {
        const body = await request.json();
        const { idToken, sessionCookie } = body;
        const cookieStore = cookies();
        const sessionCookieFromRequest = cookieStore.get('adminSession')?.value;

        console.log('Verification attempt with:', {
            hasIdToken: !!idToken,
            hasSessionCookie: !!sessionCookie,
            hasCookieFromRequest: !!sessionCookieFromRequest
        });

        // Try to verify with session cookie first
        if (sessionCookieFromRequest) {
            try {
                const decodedClaims = await adminAuth.verifySessionCookie(sessionCookieFromRequest, true);
                const userRecord = await adminAuth.getUser(decodedClaims.uid);
                
                if (userRecord.customClaims?.admin) {
                    return NextResponse.json({ 
                        isAdmin: true,
                        uid: userRecord.uid,
                        email: userRecord.email
                    });
                }
            } catch (error) {
                console.log('Session cookie verification failed, trying ID token');
            }
        }

        // If no valid session cookie, try ID token
        if (idToken) {
            try {
                const decodedToken = await adminAuth.verifyIdToken(idToken);
                const userRecord = await adminAuth.getUser(decodedToken.uid);

                if (!userRecord.customClaims?.admin) {
                    return NextResponse.json({ 
                        isAdmin: false,
                        error: 'Insufficient permissions' 
                    }, { 
                        status: 403 
                    });
                }

                // Create a new session cookie
                const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
                const newSessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

                const response = NextResponse.json({ 
                    isAdmin: true,
                    uid: userRecord.uid,
                    email: userRecord.email
                });

                // Set the session cookie
                response.cookies.set('adminSession', newSessionCookie, {
                    maxAge: expiresIn,
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/'
                });

                return response;
            } catch (error) {
                console.error('ID token verification failed:', error);
                return NextResponse.json({ 
                    isAdmin: false,
                    error: 'Invalid token' 
                }, { 
                    status: 401 
                });
            }
        }

        return NextResponse.json({ 
            isAdmin: false,
            error: 'No valid authentication provided' 
        }, { 
            status: 401 
        });

    } catch (error) {
        console.error('Unexpected error during admin verification:', error);
        return NextResponse.json({ 
            isAdmin: false,
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { 
            status: 500 
        });
    }
}

export async function OPTIONS(request) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
                ? 'https://speedtrapracing.com' 
                : 'http://localhost:3000'
        }
    });
}