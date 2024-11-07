// src/app/api/braintree/token/route.js
import braintree from 'braintree';
import { NextResponse } from 'next/server';

// Initialize Braintree gateway
const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox, // Change to Production for live
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY
});

export async function GET(request) {
  try {
    // Generate a new client token
    const { clientToken } = await gateway.clientToken.generate({
      // You can optionally specify a customerId if you want to vault payment methods
      // customerId: 'your-customer-id'
    });

    // Return the token with proper headers
    return NextResponse.json(
      { clientToken },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error generating Braintree token:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        error: 'Failed to generate payment token',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}