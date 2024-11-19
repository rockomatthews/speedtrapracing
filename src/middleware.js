import { NextResponse } from 'next/server';

export async function middleware(request) {
    if (request.nextUrl.pathname.startsWith('/admin')) {
        console.log('👉 Middleware executing for:', request.nextUrl.pathname);
        
        try {
            const sessionCookie = request.cookies.get('session')?.value;
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
                },
                body: JSON.stringify({ sessionCookie }),
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
                    headers: { 'Content-Type': 'text/plain' },
                });
            }

            console.log('✅ Admin access granted');
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('x-user-id', data.uid);
            requestHeaders.set('x-user-role', 'admin');

            return NextResponse.next({
                request: { headers: requestHeaders }
            });
            
        } catch (error) {
            console.error('🚨 Middleware error:', error);
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('from', request.nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*']
};