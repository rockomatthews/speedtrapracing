import { NextResponse } from 'next/server';
import braintree from 'braintree';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Production,
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY
});

export async function GET() {
    try {
        console.log('Initializing client token generation in production environment');

        const clientTokenResponse = await gateway.clientToken.generate({
            merchantAccountId: process.env.BRAINTREE_MERCHANT_ID
        });

        console.log('Successfully generated production client token');

        const response = NextResponse.json(
            { clientToken: clientTokenResponse.clientToken },
            { 
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Content-Type': 'application/json',
                    'X-Content-Type-Options': 'nosniff'
                }
            }
        );

        return response;
    } catch (error) {
        console.error('Failed to generate client token:', {
            errorMessage: error.message,
            errorType: error.name,
            errorStack: error.stack
        });

        return NextResponse.json(
            { 
                error: 'Failed to generate client token',
                message: error.message,
                code: error.code || 'CLIENT_TOKEN_ERROR'
            },
            { 
                status: 500,
                headers: {
                    'Cache-Control': 'no-store, must-revalidate',
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}