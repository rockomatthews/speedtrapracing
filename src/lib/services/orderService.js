import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, orderBy, where } from 'firebase/firestore';

export const orderService = {
  // Create new order
  createOrder: async (orderData, transactionResult) => {
    try {
      const orderRef = collection(db, 'orders');
      const order = {
        ...orderData,
        braintreeTransactionId: transactionResult.transaction.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'completed',
        paymentStatus: 'paid',
        fulfillmentStatus: 'unfulfilled',
        // Store calculation details
        totals: {
          subtotal: parseFloat(orderData.subtotal || 0),
          tax: parseFloat(orderData.tax_total || 0),
          shipping: parseFloat(orderData.shipping_total || 0),
          total: parseFloat(orderData.total || 0),
        },
        // Store payment details
        payment: {
          method: transactionResult.transaction.paymentInstrumentType,
          status: transactionResult.transaction.status,
          processorResponseCode: transactionResult.transaction.processorResponseCode,
          processorResponseText: transactionResult.transaction.processorResponseText,
        }
      };

      const docRef = await addDoc(orderRef, order);
      console.log('Order saved to Firestore:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving order to Firestore:', error);
      throw error;
    }
  },

  // Get all orders with optional filtering
  getOrders: async (filters = {}) => {
    try {
      const ordersRef = collection(db, 'orders');
      let q = query(ordersRef, orderBy('createdAt', 'desc'));

      // Apply filters if any
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.customerId) {
        q = query(q, where('customerId', '==', filters.customerId));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Get single order
  getOrder: async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      return {
        id: orderDoc.id,
        ...orderDoc.data()
      };
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, status, fulfillmentStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        fulfillmentStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }
};