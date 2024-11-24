import { NextResponse } from 'next/server';

export async function middleware(request) {
    console.log('🔍 Middleware executing for:', request.nextUrl.pathname);

    // Add security headers
    const headers = new Headers();
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
    headers.set('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.braintreegateway.com https://*.paypal.com https://js.braintreegateway.com https://apis.google.com https://*.googleapis.com https://www.paypalobjects.com https://api2.amplitude.com",
        "style-src 'self' 'unsafe-inline' https://assets.braintreegateway.com",
        "img-src 'self' data: blob: https: *.ctfassets.net *.braintreegateway.com *.adyen.com *.paypal.com lh3.googleusercontent.com *.googleapis.com",
        "font-src 'self' data: https://assets.braintreegateway.com",
        "connect-src 'self' https://api.contentful.com https://cdn.contentful.com https://preview.contentful.com https://images.ctfassets.net https://*.braintree-api.com https://*.paypal.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://www.googleapis.com https://apis.google.com https://client-analytics.braintreegateway.com https://api.braintreegateway.com https://api2.amplitude.com",
        "frame-src 'self' https://*.braintreegateway.com https://*.paypal.com https://apis.google.com https://*.googleapis.com https://assets.braintreegateway.com",
        "object-src 'none'",
        "worker-src 'self' blob:",
        "script-src-elem 'self' 'unsafe-inline' https://*.braintreegateway.com https://*.paypal.com https://js.braintreegateway.com https://apis.google.com https://*.googleapis.com https://www.paypalobjects.com https://api2.amplitude.com",
        "style-src-elem 'self' 'unsafe-inline' https://assets.braintreegateway.com"
    ].join('; '));

    if (request.nextUrl.pathname.startsWith('/admin')) {
        try {
            const sessionCookie = request.cookies.get('adminSession')?.value;
            console.log('🍪 Session cookie present:', !!sessionCookie);

            if (!sessionCookie) {
                console.log('❌ No session cookie found');
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('from', request.nextUrl.pathname);
                
                const response = NextResponse.redirect(loginUrl);
                // Add security headers to redirect
                for (const [key, value] of headers.entries()) {
                    response.headers.set(key, value);
                }
                return response;
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
                
                const response = NextResponse.redirect(loginUrl);
                // Add security headers to redirect
                for (const [key, value] of headers.entries()) {
                    response.headers.set(key, value);
                }
                return response;
            }

            const data = await verifyResponse.json();
            console.log('👤 Verification response:', data);

            if (!data.isAdmin) {
                console.log('🚫 User is not an admin');
                const response = new NextResponse('Forbidden', {
                    status: 403,
                    headers: {
                        'Content-Type': 'text/plain'
                    }
                });
                
                // Add security headers to forbidden response
                for (const [key, value] of headers.entries()) {
                    response.headers.set(key, value);
                }
                return response;
            }

            console.log('✅ Admin access granted');
            
            // Add auth headers
            headers.set('x-user-id', data.uid);
            headers.set('x-user-role', 'admin');
            headers.set('x-session-verified', 'true');

            // Create response with all headers
            const response = NextResponse.next();
            for (const [key, value] of headers.entries()) {
                response.headers.set(key, value);
            }
            
            return response;

        } catch (error) {
            console.error('🚨 Middleware error:', error);
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('from', request.nextUrl.pathname);
            
            const response = NextResponse.redirect(loginUrl);
            // Add security headers to error redirect
            for (const [key, value] of headers.entries()) {
                response.headers.set(key, value);
            }
            return response;
        }
    }

    // For non-admin routes, just add security headers
    const response = NextResponse.next();
    for (const [key, value] of headers.entries()) {
        response.headers.set(key, value);
    }
    return response;
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/((?!api|_next/static|_next/image|favicon.ico).*)'
    ]
};