// src/app/api/braintree/token/route.js
import { NextResponse } from 'next/server';
import braintree from 'braintree';

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Production,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY
});

export async function GET() {
  try {
    const response = await gateway.clientToken.generate();
    return NextResponse.json({
      success: true,
      clientToken: response.clientToken
    });
  } catch (err) {
    console.error('Token generation error:', err);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate client token' 
    }, { status: 500 });
  }
}