// src/services/orderService.js
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export const orderService = {
  async createOrder(orderData) {
    try {
      const ordersRef = collection(db, 'orders');
      const orderDoc = await addDoc(ordersRef, {
        ...orderData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending',
        fulfillment_status: 'unfulfilled'
      });
      
      return orderDoc.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
};