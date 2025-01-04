// /api/auth/admin/verify/route.js

import { cookies } from 'next/headers';
import { verifyIdToken } from '@/utils/serverAuth';

export async function POST(request) {
    console.log('Starting admin verification...', {
        environment: process.env.NODE_ENV,
        origin: request.headers.get('origin')
    });

    try {
        const { idToken } = await request.json();
        
        console.log('Verifying token...');
        const decodedToken = await verifyIdToken(idToken);
        console.log('Token verified for user:', decodedToken.uid);

        if (!decodedToken.isAdmin) {
            return Response.json({
                status: 'error',
                message: 'Not authorized as admin'
            }, { status: 403 });
        }

        return Response.json({
            status: 'success',
            uid: decodedToken.uid,
            email: decodedToken.email
        });

    } catch (error) {
        console.error('Verification error:', error);
        return Response.json({
            status: 'error',
            message: error.message
        }, { status: 401 });
    }
}