import { NextResponse } from 'next/server';
import BraintreeService from '@/lib/braintree-service';

export async function GET() {
  try {
    // Verify environment variables are present
    const envCheck = {
      merchantId: !!process.env.BRAINTREE_MERCHANT_ID,
      publicKey: !!process.env.BRAINTREE_PUBLIC_KEY,
      privateKey: !!process.env.BRAINTREE_PRIVATE_KEY,
      environment: process.env.BRAINTREE_ENVIRONMENT || 'sandbox'
    };

    // Check if any environment variables are missing
    const missingVars = Object.entries(envCheck)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return NextResponse.json({
        status: 'unhealthy',
        error: `Missing environment variables: ${missingVars.join(', ')}`,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }, { status: 500 });
    }

    // Verify gateway connection
    const isGatewayWorking = await BraintreeService.verifyGateway();

    if (!isGatewayWorking) {
      return NextResponse.json({
        status: 'unhealthy',
        error: 'Gateway verification failed',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      gateway: 'connected',
      configuration: {
        environment: process.env.BRAINTREE_ENVIRONMENT,
        merchantIdPresent: !!process.env.BRAINTREE_MERCHANT_ID,
        publicKeyPresent: !!process.env.BRAINTREE_PUBLIC_KEY,
        privateKeyPresent: !!process.env.BRAINTREE_PRIVATE_KEY
      }
    }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      type: error.type,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
}