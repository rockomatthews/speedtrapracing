// src/app/api/braintree/checkout/route.js
import { NextResponse } from 'next/server';
import braintree from 'braintree';
import medusaClient from '@/lib/medusa-client';

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Production,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY
});

export async function POST(request) {
  try {
    const { paymentMethodNonce, amount, items, shipping, paymentDetails } = await request.json();

    // First, create or update customer in Medusa
    const { customer } = await medusaClient.admin.customers.create({
      email: shipping.email,
      firstName: shipping.firstName,
      lastName: shipping.lastName,
      phone: shipping.phone,
      shippingAddresses: [{
        address1: shipping.address,
        city: shipping.city,
        state: shipping.state,
        postal_code: shipping.zipCode,
        country: shipping.country
      }]
    });

    // Create comprehensive transaction parameters
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
        id: customer.id // Link to Medusa customer
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
        productId: item.id
      }))
    };

    // Handle PayPal-specific configuration
    if (paymentDetails?.paymentMethod === 'PayPal') {
      transactionParams.options.paypal = {
        customField: shipping.email,
        description: `Order for ${shipping.firstName} ${shipping.lastName}`,
        shipping: {
          name: `${shipping.firstName} ${shipping.lastName}`,
          address: {
            street_address: shipping.address,
            locality: shipping.city,
            region: shipping.state,
            postal_code: shipping.zipCode,
            country_code: shipping.country
          }
        }
      };
    }

    // Process the transaction
    const result = await gateway.transaction.sale(transactionParams);

    if (result.success) {
      // Calculate order totals
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = parseFloat(amount) - subtotal; // Assuming difference is tax

      // Create order in Medusa with comprehensive details
      await medusaClient.admin.orders.create({
        customerId: customer.id,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.price,
          variant_id: item.variant_id,
          total: item.price * item.quantity
        })),
        total: parseFloat(amount),
        subtotal: subtotal,
        tax_total: tax > 0 ? tax : 0,
        shipping_total: 0, // Add shipping cost calculation if needed
        shipping_address: {
          first_name: shipping.firstName,
          last_name: shipping.lastName,
          address_1: shipping.address,
          city: shipping.city,
          province: shipping.state,
          postal_code: shipping.zipCode,
          country_code: shipping.country,
          phone: shipping.phone
        },
        billing_address: {
          first_name: shipping.firstName,
          last_name: shipping.lastName,
          address_1: shipping.address,
          city: shipping.city,
          province: shipping.state,
          postal_code: shipping.zipCode,
          country_code: shipping.country,
          phone: shipping.phone
        },
        email: shipping.email,
        payment_status: 'captured',
        status: 'completed',
        fulfillment_status: 'not_fulfilled',
        payment_provider: paymentDetails?.paymentMethod || 'card',
        transaction_id: result.transaction.id,
        metadata: {
          braintree_transaction_id: result.transaction.id,
          payment_method: paymentDetails?.paymentMethod || 'card',
          customer_id: customer.id
        }
      });

      // Return success with transaction details
      return NextResponse.json({ 
        success: true, 
        transaction: result.transaction,
        transactionId: result.transaction.id,
        customer: {
          id: customer.id,
          email: shipping.email
        }
      });
    } else {
      console.error('Transaction failed:', result.message);
      return NextResponse.json(
        { 
          success: false, 
          error: result.message,
          code: result.transaction?.processorResponseCode
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}