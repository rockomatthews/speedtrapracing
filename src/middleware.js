import { NextResponse } from 'next/server';

export async function middleware(request) {
    if (request.nextUrl.pathname.startsWith('/admin')) {
        console.log('👉 Middleware executing for:', request.nextUrl.pathname);
        
        try {
            // Get the session cookie
            const sessionCookie = request.cookies.get('adminSession')?.value;
            console.log('🍪 Session cookie present:', !!sessionCookie);

            if (!sessionCookie) {
                console.log('❌ No session cookie found');
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('from', request.nextUrl.pathname);
                console.log('🔄 Redirecting to:', loginUrl.toString());
                return NextResponse.redirect(loginUrl);
            }

            // Build the verification URL using the request's origin
            const verifyUrl = new URL('/api/auth/verify', request.url);
            console.log('🔍 Verifying session with:', verifyUrl.toString());

            const verifyResponse = await fetch(verifyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `adminSession=${sessionCookie}`
                },
                body: JSON.stringify({ 
                    sessionCookie,
                    path: request.nextUrl.pathname,
                    timestamp: Date.now()
                }),
                credentials: 'include'
            });

            console.log('📡 Verify response status:', verifyResponse.status);

            if (!verifyResponse.ok) {
                console.log('❌ Session verification failed');
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('from', request.nextUrl.pathname);
                return NextResponse.redirect(loginUrl);
            }

            const data = await verifyResponse.json();
            console.log('👤 Verification response:', data);

            if (!data.isAdmin) {
                console.log('🚫 User is not an admin');
                return new NextResponse('Forbidden', {
                    status: 403,
                    headers: { 
                        'Content-Type': 'text/plain',
                        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                    },
                });
            }

            console.log('✅ Admin access granted');
            
            // Create response with headers
            const response = NextResponse.next();
            
            // Set security headers
            response.headers.set('X-Frame-Options', 'DENY');
            response.headers.set('X-Content-Type-Options', 'nosniff');
            response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
            response.headers.set('X-XSS-Protection', '1; mode=block');
            response.headers.set('X-DNS-Prefetch-Control', 'on');
            
            // Set cached state and user info
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('x-user-id', data.uid);
            requestHeaders.set('x-user-role', 'admin');
            requestHeaders.set('x-session-verified', 'true');

            return response;
            
        } catch (error) {
            console.error('🚨 Middleware error:', error);
            // Add detailed error logging
            console.error('Error details:', {
                path: request.nextUrl.pathname,
                timestamp: new Date().toISOString(),
                errorMessage: error.message,
                errorStack: error.stack
            });

            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('from', request.nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*'
    ]
};