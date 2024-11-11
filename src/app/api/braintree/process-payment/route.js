// src/app/api/braintree/process-payment/route.js
import braintree from 'braintree';
import { NextResponse } from 'next/server';

// Validate environment variables
const REQUIRED_ENV_VARS = {
  BRAINTREE_MERCHANT_ID: process.env.BRAINTREE_MERCHANT_ID,
  BRAINTREE_PUBLIC_KEY: process.env.BRAINTREE_PUBLIC_KEY,
  BRAINTREE_PRIVATE_KEY: process.env.BRAINTREE_PRIVATE_KEY,
  BRAINTREE_ENVIRONMENT: process.env.BRAINTREE_ENVIRONMENT
};

// Check for missing environment variables
const missingVars = Object.entries(REQUIRED_ENV_VARS)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Initialize Braintree gateway with explicit environment handling
const gateway = new braintree.BraintreeGateway({
  environment: process.env.BRAINTREE_ENVIRONMENT === 'production'
    ? braintree.Environment.Production
    : braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY
});

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { 
      paymentMethodNonce, 
      amount, 
      items,
      customerId
    } = body;

    // Log transaction attempt in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Processing payment:', {
        amount,
        itemCount: items?.length,
        environment: process.env.BRAINTREE_ENVIRONMENT,
        merchantAccountId: process.env.BRAINTREE_MERCHANT_ACCOUNT_ID || 'Not Set'
      });
    }

    // Validate required fields
    if (!paymentMethodNonce || !amount) {
      return NextResponse.json(
        { error: 'Missing required payment information' },
        { status: 400 }
      );
    }

    // Prepare transaction options
    const transactionOptions = {
      amount: amount.toString(),
      paymentMethodNonce,
      merchantAccountId: process.env.BRAINTREE_MERCHANT_ACCOUNT_ID || undefined,
      options: {
        submitForSettlement: true,
        storeInVaultOnSuccess: Boolean(customerId),
        threeDSecure: {
          required: true
        }
      },
      orderId: `ORDER-${Date.now()}`,
      lineItems: items?.map(item => ({
        name: item.title,
        quantity: item.quantity,
        unitAmount: item.price,
        totalAmount: (item.quantity * parseFloat(item.price)).toFixed(2)
      }))
    };

    // Add customer information if available
    if (customerId) {
      transactionOptions.customerId = customerId;
    }

    // Log transaction options in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Transaction options:', JSON.stringify(transactionOptions, null, 2));
    }

    // Create the transaction
    const result = await gateway.transaction.sale(transactionOptions);

    // Handle the result
    if (result.success) {
      return NextResponse.json({
        success: true,
        transaction: {
          id: result.transaction.id,
          status: result.transaction.status,
          amount: result.transaction.amount,
          currencyIsoCode: result.transaction.currencyIsoCode,
          paymentInstrumentType: result.transaction.paymentInstrumentType,
          merchantAccountId: result.transaction.merchantAccountId,
          processorResponseCode: result.transaction.processorResponseCode,
          processorResponseText: result.transaction.processorResponseText,
          environment: process.env.BRAINTREE_ENVIRONMENT
        }
      }, { status: 200 });
    } else {
      // Handle validation errors
      const errorMessage = result.message || 'Transaction failed';
      const processorResponse = result.transaction?.processorResponseText;
      
      console.error('Transaction failed:', {
        message: errorMessage,
        processorResponse,
        environment: process.env.BRAINTREE_ENVIRONMENT,
        result
      });

      return NextResponse.json({
        success: false,
        error: errorMessage,
        processorResponse,
        code: result.transaction?.processorResponseCode,
        environment: process.env.BRAINTREE_ENVIRONMENT
      }, { status: 422 });
    }

  } catch (error) {
    // Handle unexpected errors
    console.error('Payment processing error:', {
      error,
      environment: process.env.BRAINTREE_ENVIRONMENT
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while processing your payment',
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          environment: process.env.BRAINTREE_ENVIRONMENT
        } : undefined
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  // Handle CORS preflight requests
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}