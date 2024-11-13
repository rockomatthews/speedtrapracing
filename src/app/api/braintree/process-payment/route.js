// src/app/api/braintree/process-payment/route.js
import { NextResponse } from 'next/server';
import braintree from 'braintree';

const gateway = new braintree.BraintreeGateway({
  environment: process.env.NODE_ENV === 'production' 
    ? braintree.Environment.Production 
    : braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY
});

export async function POST(request) {
  console.log('Payment processing started:', new Date().toISOString());
  
  try {
    const { paymentMethodNonce, amount } = await request.json();
    
    console.log('Processing payment:', { amount, environment: process.env.NODE_ENV });

    const result = await gateway.transaction.sale({
      amount,
      paymentMethodNonce,
      options: {
        submitForSettlement: true
      }
    });

    if (result.success) {
      console.log('Payment successful:', result.transaction.id);
      return NextResponse.json({ 
        success: true,
        transactionId: result.transaction.id
      });
    } else {
      console.error('Payment failed:', result.message);
      return NextResponse.json({ 
        success: false, 
        error: result.message 
      });
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}