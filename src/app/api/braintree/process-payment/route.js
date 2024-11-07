// src/app/api/braintree/process-payment/route.js
import braintree from 'braintree';
import { NextResponse } from 'next/server';

// Initialize Braintree gateway
const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox, // Change to Production for live
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
      // You might also want to accept:
      // customerId,
      // shippingAddress,
      // billingAddress,
    } = body;

    // Validate required fields
    if (!paymentMethodNonce || !amount) {
      return NextResponse.json(
        { error: 'Missing required payment information' },
        { status: 400 }
      );
    }

    // Create the transaction
    const result = await gateway.transaction.sale({
      amount: amount.toString(),
      paymentMethodNonce,
      // Optional: store the payment method in the vault
      options: {
        submitForSettlement: true,
        storeInVaultOnSuccess: true,
        threeDSecure: {
          required: true // Enable 3D Secure when possible
        }
      },
      // Optional: include order details
      orderId: `ORDER-${Date.now()}`,
      // Optional: include customer and line items
      customer: {
        // firstName: customer.firstName,
        // lastName: customer.lastName,
        // email: customer.email,
      },
      // Include line items for PayPal/records
      lineItems: items.map(item => ({
        name: item.title,
        quantity: item.quantity,
        unitAmount: item.price,
        totalAmount: (item.quantity * parseFloat(item.price)).toFixed(2)
      })),
      // Optional: include shipping/billing addresses
      // billing: {
      //   firstName: billingAddress.firstName,
      //   lastName: billingAddress.lastName,
      //   streetAddress: billingAddress.street,
      //   locality: billingAddress.city,
      //   region: billingAddress.state,
      //   postalCode: billingAddress.zip,
      //   countryCodeAlpha2: billingAddress.country
      // },
      // shipping: {
      //   firstName: shippingAddress.firstName,
      //   lastName: shippingAddress.lastName,
      //   streetAddress: shippingAddress.street,
      //   locality: shippingAddress.city,
      //   region: shippingAddress.state,
      //   postalCode: shippingAddress.zip,
      //   countryCodeAlpha2: shippingAddress.country
      // }
    });

    // Handle the result
    if (result.success) {
      // You might want to store the order in your database here
      // await db.orders.create({...})

      return NextResponse.json({
        success: true,
        transaction: {
          id: result.transaction.id,
          status: result.transaction.status,
          amount: result.transaction.amount,
          currencyIsoCode: result.transaction.currencyIsoCode,
          paymentInstrumentType: result.transaction.paymentInstrumentType,
          // Include additional transaction details as needed
        }
      }, { status: 200 });
    } else {
      // Handle validation errors
      const errorMessage = result.message || 'Transaction failed';
      const processorResponse = result.transaction?.processorResponseText;
      
      console.error('Transaction failed:', {
        message: errorMessage,
        processorResponse,
        result
      });

      return NextResponse.json({
        success: false,
        error: errorMessage,
        processorResponse,
        code: result.transaction?.processorResponseCode
      }, { status: 422 });
    }

  } catch (error) {
    // Handle unexpected errors
    console.error('Payment processing error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while processing your payment',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Optional: Add additional route handlers for other payment operations
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