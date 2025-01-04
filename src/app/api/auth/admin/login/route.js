import { cookies } from 'next/headers';
import { verifyIdToken } from '@/utils/serverAuth';

export async function POST(request) {
  try {
    const { idToken, email } = await request.json();

    console.log('Processing admin login request:', {
      hasToken: Boolean(idToken),
      email,
      timestamp: new Date().toISOString()
    });

    if (!idToken) {
      return Response.json({ 
        status: 'error', 
        message: 'No token provided' 
      }, { status: 400 });
    }

    // Verify the token
    const decodedToken = await verifyIdToken(idToken);

    if (!decodedToken.isAdmin) {
      return Response.json({ 
        status: 'error', 
        message: 'Not authorized as admin' 
      }, { status: 403 });
    }

    console.log('Token verified:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isAdmin: decodedToken.isAdmin
    });

    // Set the admin session cookie
    const cookieStore = cookies();
    const cookieValue = encodeURIComponent(idToken);
    cookieStore.set('adminSession', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 432000 // 5 days
    });

    const response = new Response(
      JSON.stringify({
        status: 'success',
        message: 'Admin session created',
        email: decodedToken.email
      }), 
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `adminSession=${cookieValue}; Path=/; Max-Age=432000; SameSite=Lax${
            process.env.NODE_ENV === 'production' ? '; Secure' : ''
          }`
        }
      }
    );

    return response;

  } catch (error) {
    console.error('Admin login error:', error);
    return Response.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 });
  }
} 