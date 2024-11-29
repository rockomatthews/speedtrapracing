import { NextResponse } from 'next/server';
import braintree from 'braintree';
import medusaClient from '@/lib/medusa-client';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper function to sanitize input
const sanitizeInput = (value) => {
  if (!value) return '';
  return String(value)
    .replace(/[^\w\s@.-]/g, '')
    .trim()
    .substring(0, 255);
};

async function logTransaction(type, data, error = null) {
  try {
    const logsRef = collection(db, 'transaction_logs');
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) acc[key] = value;
      return acc;
    }, {});

    await addDoc(logsRef, {
      type,
      timestamp: serverTimestamp(),
      data: {
        ...cleanData,
        environment: 'production',
        userId: cleanData.userId || 'guest',
        isGuest: !cleanData.userId,
        customerEmail: cleanData.shipping?.email || cleanData.customerEmail || 'unknown'
      },
      error: error ? {
        message: error.message || 'Unknown error',
        stack: error.stack || '',
        code: error.code || 'unknown'
      } : null,
      status: error ? 'error' : 'success'
    });
  } catch (logError) {
    console.error('Failed to write transaction log:', logError);
  }
}

async function createOrUpdateMedusaCustomer(shipping, userId) {
  try {
    // Try to find existing customer by email
    const { customers } = await medusaClient.admin.customers.list({
      email: shipping.email
    });

    if (customers && customers.length > 0) {
      // Update existing customer
      await medusaClient.admin.customers.update(customers[0].id, {
        first_name: shipping.firstName,
        last_name: shipping.lastName,
        email: shipping.email,
        phone: shipping.phone
      });
      return customers[0].id;
    } else {
      // Create new customer
      const { customer } = await medusaClient.admin.customers.create({
        first_name: shipping.firstName,
        last_name: shipping.lastName,
        email: shipping.email,
        phone: shipping.phone
      });
      return customer.id;
    }
  } catch (error) {
    console.error('Error managing Medusa customer:', error);
    throw error;
  }
}

async function createMedusaOrder(orderData, customerId) {
  try {
    const { order } = await medusaClient.admin.orders.create({
      email: orderData.shipping.email,
      customer_id: customerId,
      items: orderData.items.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        title: item.title,
        unit_price: item.price * 100 // Convert to cents
      })),
      shipping_address: {
        first_name: orderData.shipping.firstName,
        last_name: orderData.shipping.lastName,
        address_1: orderData.shipping.address,
        city: orderData.shipping.city,
        province: orderData.shipping.state,
        postal_code: orderData.shipping.zipCode,
        country_code: orderData.shipping.country,
        phone: orderData.shipping.phone
      },
      billing_address: {
        first_name: orderData.shipping.firstName,
        last_name: orderData.shipping.lastName,
        address_1: orderData.shipping.address,
        city: orderData.shipping.city,
        province: orderData.shipping.state,
        postal_code: orderData.shipping.zipCode,
        country_code: orderData.shipping.country,
        phone: orderData.shipping.phone
      },
      payment_method: {
        provider_id: 'braintree',
        data: {
          transaction_id: orderData.transactionId
        }
      }
    });

    return order.id;
  } catch (error) {
    console.error('Error creating Medusa order:', error);
    throw error;
  }
}

export async function POST(request) {
  const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Production,
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY,
  });

  try {
    const requestData = await request.json();
    const { paymentMethodNonce, amount, items, shipping, userId } = requestData;

    if (!paymentMethodNonce || !amount || !shipping?.email) {
      throw new Error('Missing required fields');
    }

    // Process payment with Braintree first
    const transactionResult = await gateway.transaction.sale({
      amount: amount,
      paymentMethodNonce: paymentMethodNonce,
      options: {
        submitForSettlement: true
      },
      customer: {
        firstName: sanitizeInput(shipping.firstName),
        lastName: sanitizeInput(shipping.lastName),
        email: sanitizeInput(shipping.email),
        phone: shipping.phone ? sanitizeInput(shipping.phone) : undefined
      },
      billing: {
        firstName: sanitizeInput(shipping.firstName),
        lastName: sanitizeInput(shipping.lastName),
        streetAddress: sanitizeInput(shipping.address),
        locality: sanitizeInput(shipping.city),
        region: sanitizeInput(shipping.state),
        postalCode: sanitizeInput(shipping.zipCode),
        countryCodeAlpha2: shipping.country
      }
    });

    if (!transactionResult.success) {
      throw new Error(transactionResult.message);
    }

    // Create or update customer in Medusa
    const customerId = await createOrUpdateMedusaCustomer(shipping, userId);

    // Create order in Medusa
    const orderData = {
      shipping,
      items,
      transactionId: transactionResult.transaction.id,
      customerId
    };

    const orderId = await createMedusaOrder(orderData, customerId);

    // Log successful transaction
    await logTransaction('transaction_success', {
      userId,
      customerId,
      orderId,
      transactionId: transactionResult.transaction.id,
      amount: transactionResult.transaction.amount
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transactionResult.transaction.id,
        status: transactionResult.transaction.status,
        amount: transactionResult.transaction.amount
      },
      orderId,
      customerId
    });

  } catch (error) {
    console.error('Error processing order:', error);

    await logTransaction('system_error', {
      errorType: error.name,
      errorMessage: error.message,
      customerEmail: requestData?.shipping?.email || 'unknown'
    }, error);

    return NextResponse.json({
      success: false,
      error: 'Order processing failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}