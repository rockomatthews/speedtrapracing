import { NextResponse } from 'next/server';

export async function middleware(request) {
    if (request.nextUrl.pathname.startsWith('/admin')) {
        console.log('👉 Middleware executing for:', request.nextUrl.pathname);
        
        try {
            // Changed from 'session' to 'adminSession' to match your session handler
            const sessionCookie = request.cookies.get('adminSession')?.value;
            console.log('🍪 Session cookie present:', !!sessionCookie);

            if (!sessionCookie) {
                console.log('❌ No session cookie found');
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('from', request.nextUrl.pathname);
                console.log('🔄 Redirecting to:', loginUrl.toString());
                return NextResponse.redirect(loginUrl);
            }

            console.log('🔍 Verifying session...');
            const verifyResponse = await fetch(new URL('/api/auth/verify', request.url), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add the cookie header explicitly
                    'Cookie': `adminSession=${sessionCookie}`
                },
                body: JSON.stringify({ 
                    sessionCookie,
                    // Add additional verification data
                    path: request.nextUrl.pathname,
                    timestamp: Date.now()
                }),
                // Ensure credentials are included
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
                        // Add cache control to prevent browser caching of the forbidden response
                        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                    },
                });
            }

            console.log('✅ Admin access granted');
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('x-user-id', data.uid);
            requestHeaders.set('x-user-role', 'admin');
            requestHeaders.set('x-session-verified', 'true');

            // Clone the request with new headers and add session verification
            const response = NextResponse.next({
                request: { 
                    headers: requestHeaders 
                }
            });

            // Ensure the session cookie is preserved
            response.headers.set('x-middleware-cache', 'no-cache');
            
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