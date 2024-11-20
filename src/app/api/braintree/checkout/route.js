// Import the order service
import { orderService } from '@/lib/services/orderService';

// In your existing POST handler, after successful Braintree transaction:
if (result.success) {
  // Calculate order totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = parseFloat(amount) - subtotal;

  // Create order data
  const orderData = {
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
    shipping_total: 0,
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
  };

  try {
    // Save to Medusa
    await medusaClient.admin.orders.create(orderData);

    // Save to Firestore
    const orderId = await orderService.createOrder(orderData, result);

    // Return success with all details
    return NextResponse.json({ 
      success: true, 
      transaction: result.transaction,
      orderId,
      transactionId: result.transaction.id,
      customer: {
        id: customer.id,
        email: shipping.email
      }
    });
  } catch (error) {
    console.error('Error saving order:', error);
    // TODO: Implement rollback/refund if order save fails
    return NextResponse.json(
      { success: false, error: 'Order processing failed' },
      { status: 500 }
    );
  }
}