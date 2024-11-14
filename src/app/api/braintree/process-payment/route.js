// src/app/api/braintree/process-payment/route.js
import { NextResponse } from 'next/server';
import braintree from 'braintree';

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Production,
  merchantId: 'nw8dgz48gg9sr53b',
  publicKey: '3sb3yt7vnrwsc4wr',
  privateKey: 'a44e7fae1ddcc314e195d3998406afed'
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { paymentMethodNonce, amount } = body;

    // Validate required fields
    if (!paymentMethodNonce) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment method nonce is required' 
      }, { status: 400 });
    }

    if (!amount || isNaN(parseFloat(amount))) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid amount is required' 
      }, { status: 400 });
    }

    // Create the transaction with merchant account ID
    const result = await gateway.transaction.sale({
      amount: parseFloat(amount).toFixed(2),
      paymentMethodNonce: paymentMethodNonce,
      merchantAccountId: 'nw8dgz48gg9sr53b',
      options: {
        submitForSettlement: true
      }
    });

    if (!result.success) {
      console.error('Transaction failed:', result.message);
      return NextResponse.json({ 
        success: false, 
        error: result.message || 'Transaction failed',
        transaction: process.env.NODE_ENV === 'development' ? result.transaction : undefined
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      transaction: {
        id: result.transaction.id,
        status: result.transaction.status,
        amount: result.transaction.amount
      }
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Payment processing failed',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        name: error.name
      } : undefined
    }, { status: 500 });
  }
}