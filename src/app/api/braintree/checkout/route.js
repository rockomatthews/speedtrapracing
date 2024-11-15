// src/app/api/braintree/checkout/route.js
import { NextResponse } from 'next/server';
import braintree from 'braintree';

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Production,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY
});

export async function POST(request) {
  try {
    const { paymentMethodNonce, amount, items, shipping, paymentDetails } = await request.json();

    // Create transaction parameters
    const transactionParams = {
      amount: amount,
      paymentMethodNonce: paymentMethodNonce,
      orderId: `ORDER-${Date.now()}`,
      options: {
        submitForSettlement: true,
      },
      customer: {
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        email: shipping.email,
      },
      billing: {
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        streetAddress: shipping.address,
        locality: shipping.city,
        region: shipping.state,
        postalCode: shipping.zipCode,
        countryCodeAlpha2: shipping.country
      },
      shipping: {
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        streetAddress: shipping.address,
        locality: shipping.city,
        region: shipping.state,
        postalCode: shipping.zipCode,
        countryCodeAlpha2: shipping.country
      },
      lineItems: items.map(item => ({
        quantity: item.quantity,
        name: item.title,
        totalAmount: (item.price * item.quantity).toFixed(2),
        unitAmount: item.price,
      }))
    };

    // If it's a PayPal payment, ensure proper handling
    if (paymentDetails?.paymentMethod === 'PayPal') {
      transactionParams.options.paypal = {
        customField: shipping.email,
        description: `Order for ${shipping.firstName} ${shipping.lastName}`
      };
    }

    const result = await gateway.transaction.sale(transactionParams);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        transaction: result.transaction,
        transactionId: result.transaction.id 
      });
    } else {
      console.error('Transaction failed:', result.message);
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}