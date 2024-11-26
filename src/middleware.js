import { NextResponse } from 'next/server';

export async function middleware(request) {
    console.log('🔍 Middleware executing:', request.nextUrl.pathname);

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
        "connect-src 'self' https://api.contentful.com https://cdn.contentful.com https://preview.contentful.com https://images.ctfassets.net https://*.braintree-api.com https://*.paypal.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://www.googleapis.com https://apis.google.com https://client-analytics.braintreegateway.com https://api.braintreegateway.com https://api2.amplitude.com https://*.braintree-api.com https://*.braintreepayments.com",
        "frame-src 'self' https://*.braintreegateway.com https://*.paypal.com https://apis.google.com https://*.googleapis.com https://assets.braintreegateway.com https://*.firebaseapp.com https://speedtrapracing-aa7c8.firebaseapp.com https://*.braintreepayments.com",
        "object-src 'none'",
        "worker-src 'self' blob:",
        "script-src-elem 'self' 'unsafe-inline' https://*.braintreegateway.com https://*.paypal.com https://js.braintreegateway.com https://apis.google.com https://*.googleapis.com https://www.paypalobjects.com https://api2.amplitude.com https://*.braintreepayments.com",
        "style-src-elem 'self' 'unsafe-inline' https://assets.braintreegateway.com"
    ].join('; '));

    if (request.nextUrl.pathname.startsWith('/admin')) {
        try {
            const sessionCookie = request.cookies.get('adminSession')?.value;
            console.log('🔍 Auth:', sessionCookie ? 'Session cookie found' : 'No session cookie');

            if (!sessionCookie) {
                return redirectToLogin(request.url, request.nextUrl.pathname, headers);
            }

            const verifyUrl = new URL('/api/auth/verify', request.url);
            const verifyResponse = await fetch(verifyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `adminSession=${sessionCookie}`
                },
                body: JSON.stringify({ 
                    sessionCookie,
                    path: request.nextUrl.pathname
                })
            });

            const data = await verifyResponse.json();
            console.log('👤 Auth Status:', verifyResponse.ok ? 'Verified' : 'Failed');

            if (!verifyResponse.ok || !data.isAdmin) {
                return redirectToLogin(request.url, request.nextUrl.pathname, headers);
            }

            const response = NextResponse.next();
            applyHeaders(response, headers);
            response.headers.set('x-user-id', data.uid);
            response.headers.set('x-user-role', 'admin');
            
            return response;
        } catch (error) {
            console.error('❌ Auth Error:', error);
            return redirectToLogin(request.url, request.nextUrl.pathname, headers);
        }
    }

    const response = NextResponse.next();
    applyHeaders(response, headers);
    return response;
}

function redirectToLogin(baseUrl, path, headers) {
    const loginUrl = new URL('/login', baseUrl);
    loginUrl.searchParams.set('from', path);
    const response = NextResponse.redirect(loginUrl);
    applyHeaders(response, headers);
    return response;
}

function applyHeaders(response, headers) {
    for (const [key, value] of headers.entries()) {
        response.headers.set(key, value);
    }
}

export const config = {
    matcher: [
        '/admin/:path*'
    ]
};