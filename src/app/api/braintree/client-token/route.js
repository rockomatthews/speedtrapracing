// src/app/api/braintree/client-token/route.js
import { NextResponse } from 'next/server';
import braintree from 'braintree';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Production,  // Force production
    merchantId: 'nw8dgz48gg9sr53b',
    publicKey: 'dwq5jj83m6gn59rg',
    privateKey: 'fd5336ad01dd98d7eda800b123d16260'
});

export async function GET() {
  try {
    console.log('Generating production client token...');

    const { clientToken } = await gateway.clientToken.generate({});

    console.log('Client token generated successfully');

    return NextResponse.json({ clientToken });
  } catch (error) {
    console.error('Error generating client token:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}