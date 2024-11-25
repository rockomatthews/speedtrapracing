import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request) {
    console.log('🔍 Verify endpoint starting...', {
        env: process.env.NODE_ENV,
        url: request.url
    });

    try {
        const body = await request.json();
        const { sessionCookie, idToken } = body;
        
        const cookieStore = cookies();
        const sessionCookieFromRequest = cookieStore.get('adminSession')?.value;

        console.log('📝 Auth tokens:', {
            bodySessionCookie: sessionCookie ? 'present' : 'missing',
            requestSessionCookie: sessionCookieFromRequest ? 'present' : 'missing',
            idToken: idToken ? 'present' : 'missing'
        });

        let uid;
        let decodedClaim;
        
        const cookieToVerify = sessionCookie || sessionCookieFromRequest;
        
        if (cookieToVerify) {
            try {
                decodedClaim = await adminAuth.verifySessionCookie(cookieToVerify);
                uid = decodedClaim.uid;
                console.log('✅ Session cookie verified for UID:', uid);
            } catch (cookieError) {
                console.error('❌ Cookie verification failed:', cookieError);
                return NextResponse.json({ 
                    status: 'error',
                    message: 'Invalid session'
                }, { 
                    status: 401 
                });
            }
        } else if (idToken) {
            try {
                const decodedToken = await adminAuth.verifyIdToken(idToken);
                uid = decodedToken.uid;
                console.log('✅ ID token verified for UID:', uid);

                const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
                const newSessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
                
                const response = NextResponse.json({
                    status: 'success',
                    uid: uid,
                    email: decodedToken.email,
                    isAdmin: true
                });

                response.cookies.set('adminSession', newSessionCookie, {
                    maxAge: expiresIn,
                    httpOnly: true,
                    secure: true,
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
            console.error('❌ No valid authentication provided');
            return NextResponse.json({ 
                status: 'error',
                message: 'Authentication required'
            }, { 
                status: 401 
            });
        }

        try {
            const userDoc = await adminDb.collection('Users').doc(uid).get();
            console.log('📋 User document check:', {
                exists: userDoc.exists,
                uid: uid
            });
            
            if (!userDoc.exists) {
                return NextResponse.json({ 
                    status: 'error',
                    message: 'User not found'
                }, { 
                    status: 403 
                });
            }

            const userData = userDoc.data();
            console.log('👤 User data:', {
                isAdmin: userData.isAdmin,
                email: userData.email
            });

            if (!userData.isAdmin) {
                return NextResponse.json({ 
                    status: 'error',
                    message: 'Not authorized'
                }, { 
                    status: 403 
                });
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

        } catch (dbError) {
            console.error('❌ Database error:', dbError);
            return NextResponse.json({ 
                status: 'error',
                message: 'Database error'
            }, { 
                status: 500 
            });
        }

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