// src/lib/medusa-client.mjs
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  getDocs, 
  orderBy, 
  updateDoc,
  deleteDoc,
  getDoc,
  where
} from 'firebase/firestore';

class MedusaFirebaseClient {
  constructor() {
    if (!db) {
      throw new Error('Firebase DB not initialized');
    }
    this.db = db;
  }

  admin = {
    orders: {
      list: async () => {
        try {
          if (!this.db) throw new Error('Firebase DB not initialized');
          
          const ordersRef = collection(this.db, 'orders');
          const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(ordersQuery);
          
          const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          return { orders };
        } catch (error) {
          console.error('Error listing orders:', error);
          throw error;
        }
      },

      create: async (orderData) => {
        try {
          if (!this.db) throw new Error('Firebase DB not initialized');
          
          const ordersRef = collection(this.db, 'orders');
          const newOrderRef = doc(ordersRef);
          
          const order = {
            id: newOrderRef.id,
            customerId: orderData.customerId,
            items: orderData.items.map(item => ({
              id: item.id,
              title: item.title,
              quantity: item.quantity,
              unit_price: this.formatPrice(item.price, true),
              variant_id: item.variant_id,
              total: this.formatPrice(item.price * item.quantity, true)
            })),
            total: this.formatPrice(orderData.total, true),
            shipping_address: {
              first_name: orderData.shipping_address.first_name,
              last_name: orderData.shipping_address.last_name,
              address_1: orderData.shipping_address.address_1,
              city: orderData.shipping_address.city,
              province: orderData.shipping_address.province,
              postal_code: orderData.shipping_address.postal_code,
              country_code: orderData.shipping_address.country_code,
              phone: orderData.shipping_address.phone || null
            },
            billing_address: orderData.billing_address || orderData.shipping_address,
            payment_status: orderData.payment_status || 'pending',
            fulfillment_status: 'not_fulfilled',
            status: orderData.status || 'pending',
            metadata: {
              ...orderData.metadata,
              payment_provider: orderData.payment_provider || 'braintree',
              shipping_method: orderData.shipping_method || 'standard'
            },
            transaction_id: orderData.transaction_id,
            email: orderData.email || orderData.shipping_address.email,
            currency_code: 'USD',
            tax_total: this.formatPrice(orderData.tax_total || 0, true),
            shipping_total: this.formatPrice(orderData.shipping_total || 0, true),
            subtotal: this.formatPrice(orderData.subtotal || orderData.total, true),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await setDoc(newOrderRef, order);

          if (order.customerId) {
            const customerRef = doc(this.db, 'customers', order.customerId);
            const customerDoc = await getDoc(customerRef);
            if (customerDoc.exists()) {
              const customerOrders = customerDoc.data().orders || [];
              customerOrders.push(order.id);
              await updateDoc(customerRef, { 
                orders: customerOrders,
                updatedAt: new Date().toISOString()
              });
            }
          }

          return { order };
        } catch (error) {
          console.error('Error creating order:', error);
          throw error;
        }
      },

      update: async (orderId, updateData) => {
        try {
          if (!this.db) throw new Error('Firebase DB not initialized');
          
          const orderRef = doc(this.db, 'orders', orderId);
          const orderDoc = await getDoc(orderRef);
          
          if (!orderDoc.exists()) {
            throw new Error('Order not found');
          }

          const priceUpdates = {};
          if (updateData.total) {
            priceUpdates.total = this.formatPrice(updateData.total, true);
          }
          if (updateData.tax_total) {
            priceUpdates.tax_total = this.formatPrice(updateData.tax_total, true);
          }
          if (updateData.shipping_total) {
            priceUpdates.shipping_total = this.formatPrice(updateData.shipping_total, true);
          }
          if (updateData.subtotal) {
            priceUpdates.subtotal = this.formatPrice(updateData.subtotal, true);
          }

          const updatedOrder = {
            ...orderDoc.data(),
            ...updateData,
            ...priceUpdates,
            updatedAt: new Date().toISOString()
          };

          if (updateData.items) {
            updatedOrder.items = updateData.items.map(item => ({
              ...item,
              unit_price: this.formatPrice(item.price, true),
              total: this.formatPrice(item.price * item.quantity, true)
            }));
          }

          await updateDoc(orderRef, updatedOrder);
          return { order: updatedOrder };
        } catch (error) {
          console.error('Error updating order:', error);
          throw error;
        }
      },

      retrieve: async (orderId) => {
        try {
          if (!this.db) throw new Error('Firebase DB not initialized');
          
          const orderRef = doc(this.db, 'orders', orderId);
          const orderDoc = await getDoc(orderRef);
          
          if (!orderDoc.exists()) {
            throw new Error('Order not found');
          }

          let customer = null;
          const orderData = orderDoc.data();
          if (orderData.customerId) {
            const customerRef = doc(this.db, 'customers', orderData.customerId);
            const customerDoc = await getDoc(customerRef);
            if (customerDoc.exists()) {
              customer = {
                id: customerDoc.id,
                ...customerDoc.data()
              };
            }
          }

          return { 
            order: { 
              id: orderDoc.id, 
              ...orderData,
              customer
            } 
          };
        } catch (error) {
          console.error('Error retrieving order:', error);
          throw error;
        }
      },

      fulfillOrder: async (orderId) => {
        try {
          if (!this.db) throw new Error('Firebase DB not initialized');
          
          const orderRef = doc(this.db, 'orders', orderId);
          const orderDoc = await getDoc(orderRef);
          
          if (!orderDoc.exists()) {
            throw new Error('Order not found');
          }

          const updatedOrder = {
            ...orderDoc.data(),
            fulfillment_status: 'fulfilled',
            status: 'completed',
            updatedAt: new Date().toISOString()
          };

          await updateDoc(orderRef, updatedOrder);
          return { order: updatedOrder };
        } catch (error) {
          console.error('Error fulfilling order:', error);
          throw error;
        }
      },

      cancelOrder: async (orderId) => {
        try {
          if (!this.db) throw new Error('Firebase DB not initialized');
          
          const orderRef = doc(this.db, 'orders', orderId);
          const orderDoc = await getDoc(orderRef);
          
          if (!orderDoc.exists()) {
            throw new Error('Order not found');
          }

          const updatedOrder = {
            ...orderDoc.data(),
            status: 'cancelled',
            fulfillment_status: 'cancelled',
            updatedAt: new Date().toISOString(),
            metadata: {
              ...orderDoc.data().metadata,
              cancelled_at: new Date().toISOString()
            }
          };

          await updateDoc(orderRef, updatedOrder);
          return { order: updatedOrder };
        } catch (error) {
          console.error('Error cancelling order:', error);
          throw error;
        }
      }
    },

    products: {
      create: async (productData) => {
        try {
          if (!this.db) throw new Error('Firebase DB not initialized');
          
          const productsRef = collection(this.db, 'products');
          const newProductRef = doc(productsRef);
          
          const priceInCents = parseInt(parseFloat(productData.price) * 100);

          const product = {
            id: newProductRef.id,
            title: productData.title,
            description: productData.description,
            category: productData.category || "Uncategorized",
            size: productData.size || '',
            inventory: productData.inventory || '0',
            images: [
              {
                src: productData.imageUrl || 'https://placehold.co/400x300?text=No+Image',
                alt: productData.title || 'Product Image'
              }
            ],
            thumbnail: productData.imageUrl || 'https://placehold.co/400x300?text=No+Image',
            handle: productData.handle || this.createHandle(productData.title),
            variants: [
              {
                id: `${newProductRef.id}-default`,
                title: productData.title,
                prices: [{
                  amount: priceInCents,
                  currency_code: 'USD'
                }],
                inventory_quantity: parseInt(productData.inventory)
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await setDoc(newProductRef, product);
          return { product };
        } catch (error) {
          console.error('Error creating product:', error);
          throw error;
        }
      },

      update: async (productId, updateData) => {
        try {
          if (!this.db) throw new Error('Firebase DB not initialized');
          
          const productRef = doc(this.db, 'products', productId);
          const productDoc = await getDoc(productRef);
          
          if (!productDoc.exists()) {
            throw new Error('Product not found');
          }

          const priceInCents = parseInt(parseFloat(updateData.price) * 100);

          const updatedProduct = {
            ...productDoc.data(),
            title: updateData.title,
            description: updateData.description,
            category: updateData.category,
            size: updateData.size,
            inventory: updateData.inventory,
            images: [
              {
                src: updateData.imageUrl || productDoc.data().images[0]?.src,
                alt: updateData.title || productDoc.data().images[0]?.alt
              }
            ],
            thumbnail: updateData.imageUrl || productDoc.data().thumbnail,
            variants: [
              {
                id: `${productId}-default`,
                title: updateData.title,
                prices: [{
                  amount: priceInCents,
                  currency_code: 'USD'
                }],
                inventory_quantity: parseInt(updateData.inventory)
              }
            ],
            updatedAt: new Date().toISOString()
          };

          await updateDoc(productRef, updatedProduct);
          return { product: updatedProduct };
        } catch (error) {
          console.error('Error updating product:', error);
          throw error;
        }
      },

      delete: async (productId) => {
        try {
          if (!this.db) throw new Error('Firebase DB not initialized');
          const productRef = doc(this.db, 'products', productId);
          await deleteDoc(productRef);
          return { id: productId };
        } catch (error) {
          console.error('Error deleting product:', error);
          throw error;
        }
      },

      list: async () => {
        try {
          if (!this.db) throw new Error('Firebase DB not initialized');

          const productsRef = collection(this.db, 'products');
          const productsQuery = query(
            productsRef,
            orderBy('createdAt', 'desc')
          );

          const snapshot = await getDocs(productsQuery);
          const products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          return { products };
        } catch (error) {
          console.error('Error listing products:', error);
          throw error;
        }
      }
    }
  };

  products = {
    list: async ({ limit = 100, fields = [], expand = [] }) => {
      try {
        if (!this.db) throw new Error('Firebase DB not initialized');

        const productsRef = collection(this.db, 'products');
        const productsQuery = query(
          productsRef,
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(productsQuery);
        const products = snapshot.docs.map(doc => {
          const data = doc.data();
          const variants = data.variants || [{
            id: `${doc.id}-default`,
            prices: [{ amount: 0, currency_code: 'USD' }]
          }];
          
          return {
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            category: data.category || 'Uncategorized',
            size: data.size || '',
            inventory: data.inventory || '0',
            images: data.images || [],
            thumbnail: data.thumbnail || '',
            handle: data.handle || '',
            variants: variants,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
          };
        });

        return { products };
      } catch (error) {
        console.error('Error listing products:', error);
        throw error;
      }
    },

    retrieve: async (productId) => {
      try {
        if (!this.db) throw new Error('Firebase DB not initialized');
        
        const productRef = doc(this.db, 'products', productId);
        const productDoc = await getDoc(productRef);
        
        if (!productDoc.exists()) {
          throw new Error('Product not found');
        }

        return { product: { id: productDoc.id, ...productDoc.data() } };
      } catch (error) {
        console.error('Error retrieving product:', error);
        throw error;
      }
    }
  };

  orders = {
    list: async () => {
      try {
        if (!this.db) throw new Error('Firebase DB not initialized');

        const ordersRef = collection(this.db, 'orders');
        const ordersQuery = query(
          ordersRef,
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(ordersQuery);
        const orders = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            total: this.formatPrice(data.total || 0),
            tax_total: this.formatPrice(data.tax_total || 0),
            shipping_total: this.formatPrice(data.shipping_total || 0),
            subtotal: this.formatPrice(data.subtotal || 0),
            items: (data.items || []).map(item => ({
              ...item,
              unit_price: this.formatPrice(item.unit_price || 0),
              total: this.formatPrice(item.total || 0)
            }))
          };
        });

        return { orders };
      } catch (error) {
        console.error('Error listing orders:', error);
        throw error;
      }
    },

    retrieve: async (orderId) => {
      try {
        if (!this.db) throw new Error('Firebase DB not initialized');
        
        const orderRef = doc(this.db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);
        
        if (!orderDoc.exists()) {
          throw new Error('Order not found');
        }

        const data = orderDoc.data();
        return { 
          order: { 
            id: orderDoc.id,
            ...data,
            total: this.formatPrice(data.total || 0),
            tax_total: this.formatPrice(data.tax_total || 0),
            shipping_total: this.formatPrice(data.shipping_total || 0),
            subtotal: this.formatPrice(data.subtotal || 0),
            items: (data.items || []).map(item => ({
              ...item,
              unit_price: this.formatPrice(item.unit_price || 0),
              total: this.formatPrice(item.total || 0)
            }))
          }
        };
      } catch (error) {
        console.error('Error retrieving order:', error);
        throw error;
      }
    }
  };

  createHandle(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  formatPrice(price, toCents = false) {
    if (toCents) {
      return parseInt(parseFloat(price) * 100);
    }
    return parseFloat(price) / 100;
  }
}

const medusaClient = new MedusaFirebaseClient();
export default medusaClient;