// api/auth/verify/route.js

import { NextResponse } from 'next/server';
import { adminAuth } from '@/config/firebaseAdmin';
import { cookies } from 'next/headers';
import { adminDb } from '@/config/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function POST(request) {
    console.log('🔍 Verify endpoint starting...', {
        env: process.env.NODE_ENV,
        url: request.url
    });

    try {
        const body = await request.json().catch(() => ({}));
        const cookieStore = cookies();
        const sessionCookieFromRequest = cookieStore.get('adminSession')?.value;
        const { idToken } = body; // We'll primarily use idToken from body for new sessions

        console.log('📝 Auth tokens:', {
            requestSessionCookie: sessionCookieFromRequest ? 'present' : 'missing',
            idToken: idToken ? 'present' : 'missing'
        });

        let uid;
        let decodedClaim;
        let userData;

        // First try the session cookie if it exists
        if (sessionCookieFromRequest) {
            try {
                decodedClaim = await adminAuth.verifySessionCookie(sessionCookieFromRequest, true); // Added true for checkRevoked
                uid = decodedClaim.uid;
                console.log('✅ Session cookie verified for UID:', uid);
            } catch (cookieError) {
                console.log('Session cookie invalid or expired, checking for ID token');
                // Don't return error here - continue to check idToken
            }
        }

        // If session cookie failed or doesn't exist, try ID token
        if (!uid && idToken) {
            try {
                const decodedToken = await adminAuth.verifyIdToken(idToken);
                uid = decodedToken.uid;
                console.log('✅ ID token verified for UID:', uid);

                // Create a new session cookie
                const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
                const newSessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
                
                // Get user data first before sending response
                const userDoc = await adminDb.collection('Users').doc(uid).get();
                if (!userDoc.exists || !userDoc.data().isAdmin) {
                    return NextResponse.json({ 
                        status: 'error',
                        message: 'Not authorized as admin'
                    }, { 
                        status: 403 
                    });
                }

                userData = userDoc.data();

                const response = NextResponse.json({
                    status: 'success',
                    uid: uid,
                    email: userData.email,
                    isAdmin: true
                });

                // Set the new session cookie
                response.cookies.set('adminSession', newSessionCookie, {
                    maxAge: expiresIn,
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/'
                });

                return response;
            } catch (tokenError) {
                console.error('❌ Token verification failed:', tokenError);
                return NextResponse.json({ 
                    status: 'error',
                    message: 'Invalid token'
                }, { 
                    status: 401 
                });
            }
        }

        if (!uid) {
            return NextResponse.json({ 
                status: 'error',
                message: 'Authentication required'
            }, { 
                status: 401 
            });
        }

        // If we got here with a uid but no userData yet, fetch it
        if (!userData) {
            try {
                const userDoc = await adminDb.collection('Users').doc(uid).get();
                if (!userDoc.exists) {
                    return NextResponse.json({ 
                        status: 'error',
                        message: 'User not found'
                    }, { 
                        status: 403 
                    });
                }

                userData = userDoc.data();
                if (!userData.isAdmin) {
                    return NextResponse.json({ 
                        status: 'error',
                        message: 'Not authorized as admin'
                    }, { 
                        status: 403 
                    });
                }
            } catch (dbError) {
                console.error('❌ Database error:', dbError);
                return NextResponse.json({ 
                    status: 'error',
                    message: 'Database error'
                }, { 
                    status: 500 
                });
            }
        }

        return NextResponse.json({
            status: 'success',
            uid: uid,
            email: userData.email,
            isAdmin: true
        }, {
            headers: {
                'Cache-Control': 'no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });

    } catch (error) {
        console.error('❌ General error:', error);
        return NextResponse.json({ 
            status: 'error',
            message: 'Verification failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { 
            status: 401 
        });
    }
}