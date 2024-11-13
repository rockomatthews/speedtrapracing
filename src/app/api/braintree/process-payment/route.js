// src/app/api/braintree/process-payment/route.js
import { NextResponse } from 'next/server';
import braintree from 'braintree';

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,  
  privateKey: process.env.BRAINTREE_PRIVATE_KEY
});

export async function POST(request) {
  const { paymentMethodNonce, amount } = await request.json();

  try {
    const result = await gateway.transaction.sale({
      amount,
      paymentMethodNonce,
      options: {
        submitForSettlement: true
      }
    });

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.message 
      });
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}