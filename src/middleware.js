import { NextResponse } from 'next/server';

export async function middleware(request) {
    // Create full URL objects for the current request
    const requestUrl = new URL(request.url);
    const requestPath = request.nextUrl.pathname;
    
    // Initialize security headers
    const headers = new Headers();
    
    // Set standard security headers
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('X-XSS-Protection', '1; mode=block');
    
    // Set permissions policy with updated payment directive
    headers.set('Permissions-Policy', [
        'accelerometer=()',
        'camera=()',
        'geolocation=()',
        'gyroscope=()',
        'magnetometer=()',
        'microphone=()',
        'payment=(self "https://*.braintree-api.com" "https://*.paypal.com")',
        'usb=()'
    ].join(', '));
    
    // Set HSTS header
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Set comprehensive Content Security Policy
    headers.set('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.braintreegateway.com https://*.paypal.com https://*.braintreepayments.com https://js.braintreegateway.com https://apis.google.com https://*.googleapis.com https://www.paypalobjects.com https://api2.amplitude.com",
        "style-src 'self' 'unsafe-inline' https://assets.braintreegateway.com",
        "img-src 'self' data: blob: https: *.ctfassets.net *.braintreegateway.com *.adyen.com *.paypal.com lh3.googleusercontent.com *.googleapis.com",
        "font-src 'self' data: https://assets.braintreegateway.com https://fonts.gstatic.com",
        "connect-src 'self' https://api.contentful.com https://cdn.contentful.com https://preview.contentful.com https://images.ctfassets.net https://*.braintree-api.com https://*.paypal.com https://*.braintreepayments.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://www.googleapis.com https://apis.google.com https://client-analytics.braintreegateway.com https://api.braintreegateway.com https://api2.amplitude.com https://*.cloudfunctions.net https://us-central1-speedtrapracing-aa7c8.cloudfunctions.net",
        "frame-src 'self' https://*.braintreegateway.com https://*.paypal.com https://*.braintreepayments.com https://apis.google.com https://*.googleapis.com https://assets.braintreegateway.com https://*.firebaseapp.com https://speedtrapracing-aa7c8.firebaseapp.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "worker-src 'self' blob:",
        "script-src-elem 'self' 'unsafe-inline' https://*.braintreegateway.com https://*.paypal.com https://*.braintreepayments.com https://js.braintreegateway.com https://apis.google.com https://*.googleapis.com https://www.paypalobjects.com https://api2.amplitude.com",
        "style-src-elem 'self' 'unsafe-inline' https://assets.braintreegateway.com"
    ].join('; '));

    // Handle admin routes
    if (requestPath.startsWith('/admin')) {
        // Check for admin session cookie
        const sessionCookie = request.cookies.get('adminSession')?.value;

        // If no session cookie exists, redirect to login
        if (!sessionCookie) {
            return redirectToLogin(requestUrl, requestPath, headers);
        }

        try {
            // Construct Firebase Functions verify URL
            const verifyUrl = new URL('https://us-central1-speedtrapracing-aa7c8.cloudfunctions.net/api/auth/verify');
            const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
            
            // Make verification request to Firebase Functions
            const verifyResponse = await fetch(verifyUrl.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `adminSession=${sessionCookie}`,
                    'X-Requested-With': 'middleware',
                    'Host': request.headers.get('host'),
                    'X-Forwarded-Proto': protocol,
                    'Origin': requestUrl.origin
                },
                body: JSON.stringify({
                    path: requestPath,
                    timestamp: Date.now(),
                    origin: requestUrl.origin
                })
            });

            // Handle unsuccessful verification response
            if (!verifyResponse.ok) {
                throw new Error(`Session verification failed: ${verifyResponse.status}`);
            }

            // Parse verification response
            const data = await verifyResponse.json();

            // Check admin status
            if (!data.isAdmin) {
                throw new Error('User is not an admin');
            }

            // Create successful response
            const response = NextResponse.next();
            
            // Apply all security headers
            applyHeaders(response, headers);
            
            // Set user-specific headers
            response.headers.set('x-user-id', data.uid);
            response.headers.set('x-user-role', 'admin');
            response.headers.set('Cache-Control', 'no-store, must-revalidate');
            
            return response;
        } catch (error) {
            // Redirect to login on any verification failure
            return redirectToLogin(requestUrl, requestPath, headers);
        }
    }

    // Handle non-admin routes
    const response = NextResponse.next();
    applyHeaders(response, headers);
    return response;
}

// Helper function to handle login redirects
function redirectToLogin(baseUrl, path, headers) {
    // Create login URL with original path and timestamp
    const loginUrl = new URL('/login', baseUrl);
    loginUrl.searchParams.set('from', path);
    loginUrl.searchParams.set('timestamp', Date.now().toString());
    
    // Create redirect response
    const response = NextResponse.redirect(loginUrl);
    
    // Set cache control header
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    
    // Apply security headers
    applyHeaders(response, headers);
    
    return response;
}

// Helper function to apply security headers
function applyHeaders(response, headers) {
    headers.forEach((value, key) => {
        response.headers.set(key, value);
    });
}

// Export middleware configuration
export const config = {
    matcher: [
        '/admin/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)'
    ]
};