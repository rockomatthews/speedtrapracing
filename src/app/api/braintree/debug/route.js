import { NextResponse } from 'next/server';

export async function GET() {
  // Do not include this in production!
  const debugInfo = {
    environment: {
      nodeEnv: process.env.NODE_ENV,
      braintreeEnv: process.env.BRAINTREE_ENVIRONMENT,
    },
    credentials: {
      merchantIdLength: process.env.BRAINTREE_MERCHANT_ID?.length,
      publicKeyLength: process.env.BRAINTREE_PUBLIC_KEY?.length,
      privateKeyLength: process.env.BRAINTREE_PRIVATE_KEY?.length,
      // Never log the actual credentials!
    },
    time: new Date().toISOString(),
  };

  return NextResponse.json(debugInfo, { status: 200 });
}