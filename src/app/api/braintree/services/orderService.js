import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export const orderService = {
  async createOrder(orderData) {
    try {
      const ordersRef = collection(db, 'orders');
      
      // Create a guest customer ID if no user ID exists
      const customerId = orderData.customerId || `guest_${Date.now()}`;
      
      const orderDoc = await addDoc(ordersRef, {
        customerId,
        isGuest: !orderData.customerId, // Flag to identify guest orders
        items: orderData.items,
        total: orderData.total,
        shipping_address: orderData.shipping_address,
        payment_status: orderData.payment_status,
        transaction_id: orderData.transaction_id,
        braintree_customer_id: orderData.braintree_customer_id,
        payment_method_type: orderData.payment_method_type,
        processor_response_code: orderData.processor_response_code,
        processor_response_text: orderData.processor_response_text,
        currency_iso_code: orderData.currency_iso_code,
        merchant_account_id: orderData.merchant_account_id,
        email: orderData.shipping_address.email, // Important for guest orders
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'processing',
        fulfillment_status: 'unfulfilled'
      });

      // Create a customer record for tracking purposes
      const customersRef = collection(db, 'customers');
      await addDoc(customersRef, {
        id: customerId,
        isGuest: !orderData.customerId,
        email: orderData.shipping_address.email,
        firstName: orderData.shipping_address.firstName,
        lastName: orderData.shipping_address.lastName,
        orders: [orderDoc.id],
        shippingAddresses: [
          {
            address1: orderData.shipping_address.address_1,
            city: orderData.shipping_address.city,
            state: orderData.shipping_address.province,
            postal_code: orderData.shipping_address.postal_code,
            country: orderData.shipping_address.country_code
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return orderDoc.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
};