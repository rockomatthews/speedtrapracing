import { NextResponse } from 'next/server';

export async function middleware(request) {
    const requestUrl = new URL(request.url);
    const requestPath = request.nextUrl.pathname;
    
    const headers = new Headers();
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(self https://*.braintree-api.com https://*.paypal.com https://*.braintreepayments.com), usb=()');
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    headers.set('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.braintreegateway.com https://*.paypal.com https://*.braintreepayments.com https://js.braintreegateway.com https://apis.google.com https://*.googleapis.com https://www.paypalobjects.com https://api2.amplitude.com",
        "style-src 'self' 'unsafe-inline' https://assets.braintreegateway.com",
        "img-src 'self' data: blob: https: *.ctfassets.net *.braintreegateway.com *.adyen.com *.paypal.com lh3.googleusercontent.com *.googleapis.com",
        "font-src 'self' data: https://assets.braintreegateway.com https://fonts.gstatic.com",
        "connect-src 'self' https://api.contentful.com https://cdn.contentful.com https://preview.contentful.com https://images.ctfassets.net https://*.braintree-api.com https://*.paypal.com https://*.braintreepayments.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://www.googleapis.com https://apis.google.com https://client-analytics.braintreegateway.com https://api.braintreegateway.com https://api2.amplitude.com https://*.cloudfunctions.net",
        "frame-src 'self' https://*.braintreegateway.com https://*.paypal.com https://*.braintreepayments.com https://apis.google.com https://*.googleapis.com https://assets.braintreegateway.com https://*.firebaseapp.com https://speedtrapracing-aa7c8.firebaseapp.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "worker-src 'self' blob:",
        "script-src-elem 'self' 'unsafe-inline' https://*.braintreegateway.com https://*.paypal.com https://*.braintreepayments.com https://js.braintreegateway.com https://apis.google.com https://*.googleapis.com https://www.paypalobjects.com https://api2.amplitude.com",
        "style-src-elem 'self' 'unsafe-inline' https://assets.braintreegateway.com"
    ].join('; '));

    if (requestPath.startsWith('/admin')) {
        const sessionCookie = request.cookies.get('adminSession')?.value;

        if (!sessionCookie) {
            return redirectToLogin(requestUrl, requestPath, headers);
        }

        try {
            const verifyUrl = new URL('/api/auth/verify', requestUrl);
            const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
            
            const verifyResponse = await fetch(verifyUrl.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `adminSession=${sessionCookie}`,
                    'X-Requested-With': 'middleware',
                    'Host': request.headers.get('host'),
                    'X-Forwarded-Proto': protocol
                },
                body: JSON.stringify({
                    path: requestPath,
                    timestamp: Date.now(),
                    origin: requestUrl.origin
                })
            });

            if (!verifyResponse.ok) {
                throw new Error(`Session verification failed: ${verifyResponse.status}`);
            }

            const data = await verifyResponse.json();

            if (!data.isAdmin) {
                throw new Error('User is not an admin');
            }

            const response = NextResponse.next();
            applyHeaders(response, headers);
            
            response.headers.set('x-user-id', data.uid);
            response.headers.set('x-user-role', 'admin');
            response.headers.set('Cache-Control', 'no-store, must-revalidate');
            
            return response;
        } catch (error) {
            return redirectToLogin(requestUrl, requestPath, headers);
        }
    }

    const response = NextResponse.next();
    applyHeaders(response, headers);
    return response;
}

function redirectToLogin(baseUrl, path, headers) {
    const loginUrl = new URL('/login', baseUrl);
    loginUrl.searchParams.set('from', path);
    loginUrl.searchParams.set('timestamp', Date.now().toString());
    
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    
    applyHeaders(response, headers);
    return response;
}

function applyHeaders(response, headers) {
    headers.forEach((value, key) => {
        response.headers.set(key, value);
    });
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)'
    ]
};