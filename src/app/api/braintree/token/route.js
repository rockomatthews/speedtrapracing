// src/app/api/braintree/token/route.js
import { NextResponse } from 'next/server';
import braintree from 'braintree';

export async function GET() {
  console.log('Token request received, checking environment:', {
    NODE_ENV: process.env.NODE_ENV,
    HAS_MERCHANT_ID: !!process.env.BRAINTREE_MERCHANT_ID,
    HAS_PUBLIC_KEY: !!process.env.BRAINTREE_PUBLIC_KEY,
    HAS_PRIVATE_KEY: !!process.env.BRAINTREE_PRIVATE_KEY,
    MERCHANT_ID_LENGTH: process.env.BRAINTREE_MERCHANT_ID?.length,
    PUBLIC_KEY_LENGTH: process.env.BRAINTREE_PUBLIC_KEY?.length,
    PRIVATE_KEY_LENGTH: process.env.BRAINTREE_PRIVATE_KEY?.length
  });

  try {
    // Validate credentials exist
    if (!process.env.BRAINTREE_MERCHANT_ID || 
        !process.env.BRAINTREE_PUBLIC_KEY || 
        !process.env.BRAINTREE_PRIVATE_KEY) {
      throw new Error('Missing required Braintree credentials');
    }

    const gateway = new braintree.BraintreeGateway({
      environment: braintree.Environment.Production,
      merchantId: 'nw8dgz48gg9sr53b',
      publicKey: '3sb3yt7vnrwsc4wr',
      privateKey: 'a44e7fae1ddcc314e195d3998406afed'
    });

    // Generate a client token with merchant account ID
    const response = await gateway.clientToken.generate({
      merchantAccountId: 'nw8dgz48gg9sr53b'
    });
    
    console.log('Token generated successfully');

    if (!response.clientToken) {
      throw new Error('Failed to generate client token');
    }

    return NextResponse.json({
      success: true,
      clientToken: response.clientToken
    });

  } catch (error) {
    console.error('Detailed token error:', {
      message: error.message,
      type: error.type,
      name: error.name,
      stack: error.stack
    });

    return NextResponse.json({
      success: false,
      error: 'Token generation failed',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        type: error.type
      } : undefined
    }, { status: 500 });
  }
}