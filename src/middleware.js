import { NextResponse } from 'next/server';

export async function middleware(request) {
    console.log('🔍 Middleware executing for:', request.nextUrl.pathname);

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
        "frame-src 'self' https://*.braintreegateway.com https://*.paypal.com https://apis.google.com https://*.googleapis.com https://assets.braintreegateway.com https://*.firebaseapp.com https://speedtrapracing-aa7c8.firebaseapp.com",
        "object-src 'none'",
        "worker-src 'self' blob:",
        "script-src-elem 'self' 'unsafe-inline' https://*.braintreegateway.com https://*.paypal.com https://js.braintreegateway.com https://apis.google.com https://*.googleapis.com https://www.paypalobjects.com https://api2.amplitude.com",
        "style-src-elem 'self' 'unsafe-inline' https://assets.braintreegateway.com"
    ].join('; '));

    const response = NextResponse.next();
    
    for (const [key, value] of headers.entries()) {
        response.headers.set(key, value);
    }

    if (request.nextUrl.pathname.startsWith('/admin')) {
        try {
            console.log('🔍 Admin route detected:', request.nextUrl.pathname);
            const sessionCookie = request.cookies.get('adminSession')?.value;
            console.log('🍪 Session cookie:', sessionCookie ? 'Present' : 'Missing');

            if (!sessionCookie) {
                console.log('❌ Redirecting to login - No session cookie');
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('from', request.nextUrl.pathname);
                const redirectResponse = NextResponse.redirect(loginUrl);
                for (const [key, value] of headers.entries()) {
                    redirectResponse.headers.set(key, value);
                }
                return redirectResponse;
            }

            const verifyUrl = new URL('/api/auth/verify', request.url);
            console.log('🔍 Verify URL:', verifyUrl.toString());

            const verifyResponse = await fetch(verifyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `adminSession=${sessionCookie}`
                },
                body: JSON.stringify({ 
                    sessionCookie: sessionCookie,
                    path: request.nextUrl.pathname,
                    timestamp: Date.now()
                }),
                credentials: 'include'
            });

            const data = await verifyResponse.json();
            console.log('👤 Auth response:', {
                status: verifyResponse.status,
                isAdmin: data.isAdmin
            });

            if (!verifyResponse.ok || !data.isAdmin) {
                console.log('❌ Redirecting to login - Auth failed');
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('from', request.nextUrl.pathname);
                const redirectResponse = NextResponse.redirect(loginUrl);
                for (const [key, value] of headers.entries()) {
                    redirectResponse.headers.set(key, value);
                }
                return redirectResponse;
            }

            console.log('✅ Admin access granted');
            response.headers.set('x-user-id', data.uid);
            response.headers.set('x-user-role', 'admin');
            response.headers.set('x-session-verified', 'true');
            return response;
            
        } catch (error) {
            console.error('🚨 Auth error:', error);
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('from', request.nextUrl.pathname);
            const redirectResponse = NextResponse.redirect(loginUrl);
            for (const [key, value] of headers.entries()) {
                redirectResponse.headers.set(key, value);
            }
            return redirectResponse;
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/admin/:path*'
    ]
};