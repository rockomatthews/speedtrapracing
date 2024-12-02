import { NextResponse } from 'next/server';

// Content Security Policy Directives
const CSP_DIRECTIVES = {
    defaultSrc: ["'self'"],
    scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://*.braintreegateway.com",
        "https://*.paypal.com",
        "https://*.braintreepayments.com",
        "https://js.braintreegateway.com",
        "https://apis.google.com",
        "https://*.googleapis.com",
        "https://www.paypalobjects.com",
        "https://api2.amplitude.com"
    ],
    styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://assets.braintreegateway.com"
    ],
    imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:",
        "*.ctfassets.net",
        "*.braintreegateway.com",
        "*.adyen.com",
        "*.paypal.com",
        "lh3.googleusercontent.com",
        "*.googleapis.com"
    ],
    fontSrc: [
        "'self'",
        "data:",
        "https://assets.braintreegateway.com",
        "https://fonts.gstatic.com"
    ],
    connectSrc: [
        "'self'",
        "https://api.contentful.com",
        "https://cdn.contentful.com",
        "https://preview.contentful.com",
        "https://images.ctfassets.net",
        "https://*.braintree-api.com",
        "https://*.paypal.com",
        "https://*.braintreepayments.com",
        "https://securetoken.googleapis.com",
        "https://identitytoolkit.googleapis.com",
        "https://*.firebaseio.com",
        "wss://*.firebaseio.com",
        "https://*.googleapis.com",
        "https://www.googleapis.com",
        "https://apis.google.com",
        "https://client-analytics.braintreegateway.com",
        "https://api.braintreegateway.com",
        "https://api2.amplitude.com",
        "https://*.cloudfunctions.net",
        "https://us-central1-speedtrapracing-aa7c8.cloudfunctions.net"
    ],
    frameSrc: [
        "'self'",
        "https://*.braintreegateway.com",
        "https://*.paypal.com",
        "https://*.braintreepayments.com",
        "https://apis.google.com",
        "https://*.googleapis.com",
        "https://assets.braintreegateway.com",
        "https://*.firebaseapp.com",
        "https://speedtrapracing-aa7c8.firebaseapp.com"
    ],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    workerSrc: ["'self'", "blob:"]
};

// Simplified Permission Policy without payment
const PERMISSION_POLICY_DIRECTIVES = [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'battery=()',
    'camera=()',
    'cross-origin-isolated=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'execution-while-not-rendered=()',
    'execution-while-out-of-viewport=()',
    'fullscreen=()',
    'geolocation=()',
    'gyroscope=()',
    'keyboard-map=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'navigation-override=()',
    'picture-in-picture=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
    'sync-xhr=()',
    'payment=*',
    'usb=()',
    'web-share=()',
    'xr-spatial-tracking=()'
];

// Function to create security headers
function createSecurityHeaders() {
    const headers = new Headers();
    
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Set permissions policy with explicitly formatted directives
    headers.set('Permissions-Policy', PERMISSION_POLICY_DIRECTIVES.join(', '));
    
    // Build Content Security Policy
    const cspDirectives = Object.entries(CSP_DIRECTIVES).map(function([key, values]) {
        const formattedKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
        return `${formattedKey} ${values.join(' ')}`;
    });
    
    headers.set('Content-Security-Policy', cspDirectives.join('; '));
    
    return headers;
}

// Function to create login redirect
function createLoginRedirect(baseUrl, path, headers) {
    const loginUrl = new URL('/login', baseUrl);
    loginUrl.searchParams.set('from', path);
    loginUrl.searchParams.set('timestamp', Date.now().toString());
    
    const response = NextResponse.redirect(loginUrl);
    
    headers.forEach((value, key) => {
        response.headers.set(key, value);
    });
    
    // Log redirect attempt
    console.log('Creating login redirect:', {
        from: path,
        to: loginUrl.toString(),
        timestamp: new Date().toISOString()
    });
    
    return response;
}

// Main middleware function
export async function middleware(request) {
    const requestUrl = new URL(request.url);
    const requestPath = request.nextUrl.pathname;
    const headers = createSecurityHeaders();
    
    // Get proper verification URL based on environment
    const verificationUrl = process.env.NODE_ENV === 'production'
        ? 'https://us-central1-speedtrapracing-aa7c8.cloudfunctions.net/api/auth/admin/verify'
        : `${requestUrl.origin}/api/auth/admin/verify`;

    // Log all requests for debugging
    console.log('Middleware processing request:', {
        url: requestUrl.toString(),
        path: requestPath,
        method: request.method,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        verificationUrl: verificationUrl,
        headers: Object.fromEntries(request.headers),
        cookies: Object.fromEntries(request.cookies)
    });

    // Handle admin routes
    if (requestPath.startsWith('/admin')) {
        const sessionCookie = request.cookies.get('adminSession');
        
        console.log('Processing admin route:', {
            path: requestPath,
            hasCookie: Boolean(sessionCookie),
            cookieValue: sessionCookie?.value ? 'present' : 'missing',
            environment: process.env.NODE_ENV
        });

        if (!sessionCookie || !sessionCookie.value) {
            console.log('No admin session found, redirecting to login');
            return createLoginRedirect(requestUrl, requestPath, headers);
        }

        try {
            // Make verification request
            const verifyResponse = await fetch(verificationUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `adminSession=${sessionCookie.value}`,
                    'Origin': requestUrl.origin
                },
                credentials: 'include',
                body: JSON.stringify({
                    sessionCookie: sessionCookie.value,
                    timestamp: Date.now()
                })
            });

            const responseData = await verifyResponse.json();
            
            console.log('Verify response:', {
                status: verifyResponse.status,
                ok: verifyResponse.ok,
                data: responseData,
                timestamp: new Date().toISOString()
            });
            
            if (!verifyResponse.ok || !responseData.isAdmin) {
                console.log('Admin verification failed, redirecting to login');
                return createLoginRedirect(requestUrl, requestPath, headers);
            }

            // Create successful response
            const response = NextResponse.next();
            
            // Set cookie with appropriate domain
            const cookieString = [
                `adminSession=${sessionCookie.value}`,
                'Path=/',
                'HttpOnly',
                'Secure',
                'SameSite=Strict',
                `Domain=${process.env.NODE_ENV === 'production' ? '.speedtrapracing.com' : 'localhost'}`
            ].join('; ');
            
            response.headers.set('Set-Cookie', cookieString);
            
            // Add security headers
            headers.forEach((value, key) => {
                response.headers.set(key, value);
            });

            // Add CORS headers for production
            if (process.env.NODE_ENV === 'production') {
                response.headers.set('Access-Control-Allow-Credentials', 'true');
                response.headers.set('Access-Control-Allow-Origin', 'https://speedtrapracing.com');
            }
            
            return response;

        } catch (error) {
            console.error('Admin middleware error:', {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            return createLoginRedirect(requestUrl, requestPath, headers);
        }
    }

    // Handle non-admin routes
    const response = NextResponse.next();
    headers.forEach((value, key) => {
        response.headers.set(key, value);
    });
    return response;
}

// Middleware configuration
export const config = {
    matcher: [
        '/admin/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)'
    ]
};