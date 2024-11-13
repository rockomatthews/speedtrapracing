// First, we'll move token generation to its own page/route that loads BEFORE the cart:

// src/app/api/braintree/initial-token/route.js
import { NextResponse } from 'next/server';
import braintree from 'braintree';

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Production,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY
});

export async function GET() {
  const response = await gateway.clientToken.generate();
  return NextResponse.json({ clientToken: response.clientToken });
}