import { NextResponse } from 'next/server';
import braintree from 'braintree';
import { orderService } from '../services/orderService';  
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Helper function for transaction logging
async function logTransaction(type, data, error = null) {
  try {
    const logsRef = collection(db, 'transaction_logs');
    const logData = {
      type: type,
      timestamp: serverTimestamp(),
      data: {
        ...data,
        environment: 'production',
        userId: data.userId || 'guest',
        isGuest: !data.userId,
        customerEmail: data.shipping?.email || data.customerEmail || 'unknown'
      },
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: error.code
      } : null,
      status: error ? 'error' : 'success'
    };

    await addDoc(logsRef, logData);
  } catch (logError) {
    console.error('Failed to write transaction log:', logError);
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
    
    // Log initial checkout
    await logTransaction('checkout_initiated', {
      userId,
      amount,
      itemCount: items.length,
      shipping: {
        country: shipping.country,
        state: shipping.state,
        city: shipping.city
      },
      customerEmail: shipping.email
    });

    // Create customer in Braintree
    const customerResult = await gateway.customer.create({
      firstName: shipping.firstName,
      lastName: shipping.lastName,
      email: shipping.email,
      company: shipping.company || undefined,
      phone: shipping.phone || undefined
    });

    if (!customerResult.success) {
      await logTransaction('customer_creation_failed', {
        userId,
        braintreeError: customerResult.message,
        shipping,
        customerEmail: shipping.email
      }, new Error(customerResult.message));

      return NextResponse.json(
        { success: false, error: 'Failed to create customer' },
        { status: 400 }
      );
    }

    const customer = customerResult.customer;
    await logTransaction('customer_created', {
      userId,
      braintreeCustomerId: customer.id,
      customerEmail: shipping.email
    });

    // Create and submit transaction
    const transactionResult = await gateway.transaction.sale({
      amount: amount,
      paymentMethodNonce: paymentMethodNonce,
      customerId: customer.id,
      options: {
        submitForSettlement: true,
        storeInVaultOnSuccess: true,
        addBillingAddressToPaymentMethod: true
      },
      customer: {
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        email: shipping.email,
        phone: shipping.phone || undefined
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
      customFields: {
        user_id: userId || 'guest',
        email: shipping.email
      }
    });

    // Handle failed transaction
    if (!transactionResult.success) {
      await logTransaction('transaction_failed', {
        userId,
        braintreeCustomerId: customer.id,
        amount,
        braintreeError: transactionResult.message,
        processorResponseCode: transactionResult.transaction?.processorResponseCode,
        processorResponseText: transactionResult.transaction?.processorResponseText,
        customerEmail: shipping.email
      }, new Error(transactionResult.message));

      // Attempt refund if a transaction was created
      if (transactionResult.transaction?.id) {
        try {
          await gateway.transaction.refund(transactionResult.transaction.id);
          await logTransaction('refund_issued', {
            userId,
            transactionId: transactionResult.transaction.id,
            amount,
            customerEmail: shipping.email
          });
        } catch (refundError) {
          await logTransaction('refund_failed', {
            userId,
            transactionId: transactionResult.transaction.id,
            amount,
            customerEmail: shipping.email
          }, refundError);
        }
      }

      return NextResponse.json(
        { 
          success: false, 
          error: transactionResult.message,
          processorResponse: transactionResult.transaction?.processorResponseText 
        },
        { status: 400 }
      );
    }

    // Log successful transaction
    await logTransaction('transaction_success', {
      userId,
      braintreeCustomerId: customer.id,
      transactionId: transactionResult.transaction.id,
      amount: transactionResult.transaction.amount,
      status: transactionResult.transaction.status,
      paymentMethod: transactionResult.transaction.paymentMethodType,
      customerEmail: shipping.email
    });

    // Prepare order data
    const orderData = {
      customerId: userId || `guest_${Date.now()}`,
      isGuest: !userId,
      items: items,
      total: amount,
      shipping_address: {
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        address_1: shipping.address,
        city: shipping.city,
        province: shipping.state,
        postal_code: shipping.zipCode,
        country_code: shipping.country,
        email: shipping.email,
        phone: shipping.phone || null
      },
      payment_status: 'paid',
      transaction_id: transactionResult.transaction.id,
      braintree_customer_id: customer.id,
      payment_method_type: transactionResult.transaction.paymentMethodType,
      processor_response_code: transactionResult.transaction.processorResponseCode,
      processor_response_text: transactionResult.transaction.processorResponseText,
      currency_iso_code: transactionResult.transaction.currencyIsoCode,
      merchant_account_id: transactionResult.transaction.merchantAccountId,
      email: shipping.email
    };

    // Create order
    const orderId = await orderService.createOrder(orderData);

    // Log order creation
    await logTransaction('order_created', {
      userId,
      orderId,
      braintreeCustomerId: customer.id,
      transactionId: transactionResult.transaction.id,
      amount,
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity
      })),
      customerEmail: shipping.email
    });

    // Return success response
    return NextResponse.json({
      success: true,
      transaction: {
        id: transactionResult.transaction.id,
        status: transactionResult.transaction.status,
        amount: transactionResult.transaction.amount,
        processorResponse: transactionResult.transaction.processorResponseText
      },
      orderId,
      customer: {
        id: customer.id,
        email: shipping.email
      }
    });

  } catch (error) {
    console.error('Error processing order:', error);

    await logTransaction('system_error', {
      errorType: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      customerEmail: requestData?.shipping?.email || 'unknown'
    }, error);

    // If payment was processed but order creation failed, trigger refund
    if (transactionResult?.success && transactionResult.transaction?.id) {
      try {
        await gateway.transaction.refund(transactionResult.transaction.id);
        await logTransaction('refund_issued_after_error', {
          transactionId: transactionResult.transaction.id,
          amount: transactionResult.transaction.amount,
          customerEmail: requestData?.shipping?.email || 'unknown'
        });
      } catch (refundError) {
        console.error('Refund failed:', refundError);
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Order processing failed',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}