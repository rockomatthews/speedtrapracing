// src/middleware.js
import { NextResponse } from 'next/server';

export async function middleware(request) {
  // Only check auth for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    try {
      // Get the session cookie
      const sessionCookie = request.cookies.get('session')?.value;

      if (!sessionCookie) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Call your existing Firebase admin API endpoint to verify the session
      const verifyResponse = await fetch(new URL('/api/auth/verify', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionCookie }),
      });

      if (!verifyResponse.ok) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const { isAdmin, uid } = await verifyResponse.json();

      if (!isAdmin) {
        return new NextResponse('Forbidden', {
          status: 403,
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      }

      // Add user info to request headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', uid);
      requestHeaders.set('x-user-role', 'admin');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      
    } catch (error) {
      console.error('Admin middleware error:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};