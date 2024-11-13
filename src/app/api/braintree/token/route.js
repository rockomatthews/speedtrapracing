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
      merchantId: process.env.BRAINTREE_MERCHANT_ID.trim(),
      publicKey: process.env.BRAINTREE_PUBLIC_KEY.trim(),
      privateKey: process.env.BRAINTREE_PRIVATE_KEY.trim()
    });

    const response = await gateway.clientToken.generate();
    console.log('Token generated successfully');

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