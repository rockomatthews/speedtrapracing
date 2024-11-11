import { NextResponse } from 'next/server';
import { braintreeService } from '../../../../lib/braintree-service';

export async function GET(request) {
  try {
    const clientToken = await braintreeService.generateToken();

    return NextResponse.json({
      success: true,
      clientToken,
      config: {
        environment: 'production',
        merchantId: process.env.NEXT_PUBLIC_BRAINTREE_MERCHANT_ID,
        paypalEnabled: true,
        cardEnabled: true,
        venmoEnabled: false
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Token Generation Error:', error);

    return NextResponse.json({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Failed to generate payment token'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      }
    });
  }
}