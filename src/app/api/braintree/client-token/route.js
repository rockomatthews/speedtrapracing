// src/app/api/braintree/client-token/route.js
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
    const response = await gateway.clientToken.generate({
      merchantAccountId: process.env.BRAINTREE_MERCHANT_ID,
      paypal: {
        flow: 'checkout'
      }
    });
    return NextResponse.json({ clientToken: response.clientToken });
  } catch (error) {
    console.error('Error generating client token:', error);
    return NextResponse.json(
      { error: 'Failed to generate client token', details: error.message },
      { status: 500 }
    );
  }
}