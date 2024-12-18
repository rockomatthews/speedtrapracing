// /api/auth/admin/verify/route.js

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
    console.log('🔍 Admin verify endpoint starting...', {
        env: process.env.NODE_ENV,
        url: request.url
    });

    try {
        const body = await request.json().catch(() => ({}));
        const cookieStore = cookies();
        const sessionCookieFromRequest = cookieStore.get('adminSession')?.value;
        const { idToken } = body;

        console.log('📝 Admin auth tokens:', {
            requestSessionCookie: sessionCookieFromRequest ? 'present' : 'missing',
            idToken: idToken ? 'present' : 'missing'
        });

        let uid;
        let decodedClaim;
        let userData;

        // First try the session cookie if it exists
        if (sessionCookieFromRequest) {
            try {
                decodedClaim = await adminAuth.verifySessionCookie(sessionCookieFromRequest, true);
                uid = decodedClaim.uid;
                console.log('✅ Admin session cookie verified for UID:', uid);
            } catch (cookieError) {
                console.log('Admin session cookie invalid or expired, checking for ID token');
            }
        }

        // If session cookie failed or doesn't exist, try ID token
        if (!uid && idToken) {
            try {
                const decodedToken = await adminAuth.verifyIdToken(idToken);
                uid = decodedToken.uid;
                console.log('✅ Admin ID token verified for UID:', uid);

                // Create a new session cookie
                const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
                const newSessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
                
                // Verify admin status
                const userDoc = await adminDb.collection('Users').doc(uid).get();
                if (!userDoc.exists || !userDoc.data().isAdmin) {
                    console.log('❌ User not authorized as admin:', uid);
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
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    path: '/',
                    domain: process.env.NODE_ENV === 'production' 
                        ? '.speedtrapracing.com'  // Add the dot prefix for all subdomains
                        : 'localhost'
                });

                return response;
            } catch (tokenError) {
                console.error('❌ Admin token verification failed:', tokenError);
                return NextResponse.json({ 
                    status: 'error',
                    message: 'Invalid admin token'
                }, { 
                    status: 401 
                });
            }
        }

        if (!uid) {
            return NextResponse.json({ 
                status: 'error',
                message: 'Admin authentication required'
            }, { 
                status: 401 
            });
        }

        // If we got here with a uid but no userData yet, fetch it
        if (!userData) {
            try {
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
            } catch (dbError) {
                console.error('❌ Admin database error:', dbError);
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
        console.error('❌ General admin verification error:', error);
        return NextResponse.json({ 
            status: 'error',
            message: 'Admin verification failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { 
            status: 401 
        });
    }
}