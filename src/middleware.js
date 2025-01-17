import { NextResponse } from 'next/server';

// Content Security Policy Directives
const CSP_DIRECTIVES = {
    'default-src': ["'self'"],
    'connect-src': [
        "'self'",
        // Firebase services
        "https://*.googleapis.com",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://firestore.googleapis.com",
        "https://*.firebaseio.com",
        "wss://*.firebaseio.com",
        "https://*.cloudfunctions.net",
        "https://firebase.googleapis.com",
        "https://*.firebase.com",
        "https://*.firebaseapp.com",
        "https://www.googleapis.com",
        "https://apis.google.com",
        "https://*.gstatic.com",
        "https://firebaseinstallations.googleapis.com",
        "https://oauth2.googleapis.com",
        "https://accounts.google.com",
        
        // Stripe services
        "https://*.stripe.com",
        "https://api.stripe.com",
        
        // Other services
        "https://api.contentful.com",
        "https://cdn.contentful.com",
        "https://preview.contentful.com",
        "https://images.ctfassets.net"
    ],
    'script-src': [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://*.firebaseapp.com",
        "https://*.firebase.com",
        "https://*.gstatic.com",
        "https://apis.google.com",
        "https://*.googleapis.com",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://www.gstatic.com",
        "https://js.stripe.com",
        "https://*.stripe.com"
    ],
    'frame-src': [
        "'self'",
        "https://*.firebaseapp.com",
        "https://*.firebase.com",
        "https://accounts.google.com",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://*.stripe.com"
    ],
    'img-src': [
        "'self'",
        "data:",
        "blob:",
        "https:",
        "*.ctfassets.net",
        "*.stripe.com",
        "lh3.googleusercontent.com",
        "*.googleapis.com"
    ],
    'style-src': [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
    ],
    'font-src': [
        "'self'",
        "data:",
        "https://fonts.gstatic.com"
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': [
        "'self'",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://accounts.google.com"
    ],
    'frame-ancestors': ["'none'"],
    'worker-src': ["'self'", "blob:"]
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

// Helper function to create CSP header string
function createCSPHeader() {
    return Object.entries(CSP_DIRECTIVES)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');
}

// Create security headers
function createSecurityHeaders() {
    const headers = new Headers({
        'Content-Security-Policy': createCSPHeader(),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    });

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
    
    // Create base response first
    const response = NextResponse.next();
    
    // Apply CSP headers before any other operations
    const cspHeader = Object.entries(CSP_DIRECTIVES)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');
    
    response.headers.set('Content-Security-Policy', cspHeader);
    
    // Add other security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', PERMISSION_POLICY_DIRECTIVES.join(', '));

    // Get proper verification URL based on environment
    const verificationUrl = process.env.NODE_ENV === 'production'
        ? 'https://speedtrapracing.com/api/auth/admin/verify'
        : 'http://localhost:3000/api/auth/admin/verify';

    // Handle admin routes
    if (requestPath.startsWith('/admin')) {
        const sessionCookie = request.cookies.get('adminSession');
        
        if (!sessionCookie?.value) {
            const loginResponse = NextResponse.redirect(
                new URL(`/login?from=${encodeURIComponent(requestPath)}`, requestUrl)
            );
            // Copy security headers to redirect response
            loginResponse.headers.set('Content-Security-Policy', cspHeader);
            return loginResponse;
        }

        try {
            const verifyResponse = await fetch(verificationUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken: sessionCookie.value }),
                credentials: 'include'
            });

            if (!verifyResponse.ok) {
                const loginResponse = NextResponse.redirect(
                    new URL(`/login?from=${encodeURIComponent(requestPath)}`, requestUrl)
                );
                loginResponse.headers.set('Content-Security-Policy', cspHeader);
                return loginResponse;
            }

            // Allow the request to proceed with admin session
            response.cookies.set('adminSession', sessionCookie.value, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 432000 // 5 days
            });

        } catch (error) {
            console.error('Admin middleware error:', error);
            const loginResponse = NextResponse.redirect(
                new URL(`/login?from=${encodeURIComponent(requestPath)}`, requestUrl)
            );
            loginResponse.headers.set('Content-Security-Policy', cspHeader);
            return loginResponse;
        }
    }

    // Add CORS headers for development
    if (process.env.NODE_ENV === 'development') {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Log headers for debugging
    console.log('Response headers:', {
        csp: response.headers.get('Content-Security-Policy'),
        cors: response.headers.get('Access-Control-Allow-Origin'),
        timestamp: new Date().toISOString()
    });

    return response;
}

// Configure middleware matcher
export const config = {
    matcher: [
        // Match all paths except static files and api routes
        '/((?!_next/static|_next/image|favicon.ico|api).*)'
    ]
};