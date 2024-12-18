import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, orderBy, where, serverTimestamp } from 'firebase/firestore';

export const orderService = {
  // Create new order
  createOrder: async (orderData) => {
    try {
      // First create the transaction log
      const transactionRef = collection(db, 'transaction_logs');
      const transactionData = {
        type: 'checkout_initiated',
        status: 'success', // Set to success immediately since payment is confirmed
        data: {
          amount: orderData.total.toString(),
          customerEmail: orderData.customer?.email,
          environment: process.env.NODE_ENV || 'development',
          isGuest: !orderData.userId || orderData.userId === 'guest',
          itemCount: orderData.items?.length || 0,
          shipping: {
            address: orderData.shipping?.address,
            city: orderData.shipping?.city,
            country: 'US',
            email: orderData.customer?.email,
            firstName: orderData.shipping?.firstName,
            lastName: orderData.shipping?.lastName,
            state: orderData.shipping?.state,
            zipCode: orderData.shipping?.zipCode
          },
          userId: orderData.userId || 'guest'
        },
        timestamp: serverTimestamp(),
        error: null
      };

      await addDoc(transactionRef, transactionData);

      // Then create the order record
      const orderRef = collection(db, 'orders');
      const order = {
        ...orderData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'completed',
        paymentStatus: 'paid',
        fulfillmentStatus: 'unfulfilled'
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