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
    workerSrc: ["'self'", "blob:"],
    scriptSrcElem: [
        "'self'",
        "'unsafe-inline'",
        "https://*.braintreegateway.com",
        "https://*.paypal.com",
        "https://*.braintreepayments.com",
        "https://js.braintreegateway.com",
        "https://apis.google.com",
        "https://*.googleapis.com",
        "https://www.paypalobjects.com",
        "https://api2.amplitude.com"
    ],
    styleSrcElem: [
        "'self'",
        "'unsafe-inline'",
        "https://assets.braintreegateway.com"
    ]
};

// Permission Policy Directives
const PERMISSION_POLICY_DIRECTIVES = [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=(self)',
    'usb=()'
];

// Function to create security headers
function createSecurityHeaders() {
    const headers = new Headers();
    
    // Set standard security headers
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    headers.set('Permissions-Policy', PERMISSION_POLICY_DIRECTIVES.join(', '));
    
    // Build and set Content Security Policy
    const cspDirectives = Object.entries(CSP_DIRECTIVES).map(function([key, values]) {
        const kebabKey = key.replace(/[A-Z]/g, function(letter) {
            return `-${letter.toLowerCase()}`;
        });
        return `${kebabKey} ${values.join(' ')}`;
    });
    
    headers.set('Content-Security-Policy', cspDirectives.join('; '));
    
    return headers;
}

// Main middleware function
export async function middleware(request) {
    // Create full URL objects for the current request
    const requestUrl = new URL(request.url);
    const requestPath = request.nextUrl.pathname;
    const headers = createSecurityHeaders();

    console.log('Middleware processing request:', {
        url: requestUrl.toString(),
        path: requestPath,
        method: request.method,
        timestamp: new Date().toISOString()
    });

    // Handle admin routes specifically
    if (requestPath.startsWith('/admin')) {
        console.log('Processing admin route:', requestPath);
        
        const sessionCookie = request.cookies.get('adminSession');
        
        if (!sessionCookie || !sessionCookie.value) {
            console.log('No admin session found, redirecting to login');
            return createLoginRedirect(requestUrl, requestPath, headers);
        }

        try {
            const verifyResponse = await fetch(`${requestUrl.origin}/api/auth/admin/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `adminSession=${sessionCookie.value}` // This is important
                },
                credentials: 'include',  // Add this
                body: JSON.stringify({
                    idToken: null,  // Add this to match expected structure
                    sessionCookie: sessionCookie.value
                })
            });

            const data = await verifyResponse.json();
            
            if (!verifyResponse.ok || !data.isAdmin) {
                console.log('Admin verification failed, redirecting to login');
                return createLoginRedirect(requestUrl, requestPath, headers);
            }

            // Admin verification successful - allow request to proceed
            const response = NextResponse.next();
            headers.forEach((value, key) => response.headers.set(key, value));
            return response;
        } catch (error) {
            console.error('Admin middleware error:', error);
            return createLoginRedirect(requestUrl, requestPath, headers);
        }
    }

    // For non-admin routes, just add security headers
    const response = NextResponse.next();
    headers.forEach((value, key) => response.headers.set(key, value));
    return response;
}

function createLoginRedirect(baseUrl, path, headers) {
    const loginUrl = new URL('/login', baseUrl);
    loginUrl.searchParams.set('from', path);
    loginUrl.searchParams.set('timestamp', Date.now().toString());
    
    const response = NextResponse.redirect(loginUrl);
    headers.forEach((value, key) => response.headers.set(key, value));
    return response;
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)'
    ]
};