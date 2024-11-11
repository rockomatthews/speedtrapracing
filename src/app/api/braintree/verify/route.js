import { NextResponse } from 'next/server';
import gateway, { validateGateway } from '@/lib/braintree-server';

export async function GET() {
  try {
    // Only available in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const validation = await validateGateway();
    
    // Test basic gateway operations
    const testResults = {
      gatewayValidation: validation,
      environmentCheck: {
        nodeEnv: process.env.NODE_ENV,
        braintreeEnv: process.env.BRAINTREE_ENVIRONMENT,
      },
      credentialCheck: {
        merchantIdFormat: process.env.BRAINTREE_MERCHANT_ID?.match(/^[a-zA-Z0-9]+$/) ? 'valid' : 'invalid',
        publicKeyFormat: process.env.BRAINTREE_PUBLIC_KEY?.match(/^[a-zA-Z0-9]+$/) ? 'valid' : 'invalid',
        privateKeyFormat: process.env.BRAINTREE_PRIVATE_KEY?.match(/^[a-zA-Z0-9]+$/) ? 'valid' : 'invalid',
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(testResults, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      type: error.type,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}