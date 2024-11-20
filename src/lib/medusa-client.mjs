// src/lib/medusa-client.mjs
import { db } from './firebase';
import { getAuth } from 'firebase/auth';
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
  where,
  arrayUnion
} from 'firebase/firestore';

class MedusaFirebaseClient {
  constructor() {
    if (!db) {
      throw new Error('Firebase DB not initialized');
    }
    this.db = db;
  }

  async checkAdminStatus() {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userRef = doc(this.db, 'Users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists() || !userDoc.data().isAdmin) {
      throw new Error('User does not have admin privileges');
    }

    return user;
  }

  async getCurrentUser() {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    return user;
  }

  admin = {
    orders: {
      list: async () => {
        try {
          await this.checkAdminStatus();
          
          const ordersRef = collection(this.db, 'orders');
          const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(ordersQuery);
          
          const orders = await Promise.all(snapshot.docs.map(async doc => {
            const data = doc.data();
            
            let customer = null;
            if (data.customerId) {
              const customerRef = doc(this.db, 'Users', data.customerId);
              const customerDoc = await getDoc(customerRef);
              if (customerDoc.exists()) {
                customer = {
                  id: customerDoc.id,
                  ...customerDoc.data()
                };
              }
            }

            return {
              id: doc.id,
              ...data,
              customer,
              total: this.formatPrice(data.total || 0),
              tax_total: this.formatPrice(data.tax_total || 0),
              shipping_total: this.formatPrice(data.shipping_total || 0),
              subtotal: this.formatPrice(data.subtotal || 0)
            };
          }));

          return { orders };
        } catch (error) {
          console.error('Error listing orders:', error);
          if (error.message.includes('admin privileges')) {
            throw new Error('Access denied. Admin privileges required.');
          }
          throw new Error('Failed to load orders. Please try again.');
        }
      },

      create: async (orderData) => {
        try {
          const user = await this.getCurrentUser();
          
          const ordersRef = collection(this.db, 'orders');
          const newOrderRef = doc(ordersRef);
          
          // Update user profile with customer data
          const userRef = doc(this.db, 'Users', user.uid);
          await updateDoc(userRef, {
            firstName: orderData.shipping.firstName,
            lastName: orderData.shipping.lastName,
            email: orderData.shipping.email,
            phone: orderData.shipping.phone || null,
            hasOrdered: true,
            shippingAddresses: arrayUnion({
              address1: orderData.shipping.address,
              city: orderData.shipping.city,
              state: orderData.shipping.state,
              postal_code: orderData.shipping.zipCode,
              country: orderData.shipping.country
            }),
            updatedAt: new Date().toISOString()
          });
          
          const order = {
            id: newOrderRef.id,
            customerId: user.uid,
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
              firstName: orderData.shipping.firstName,
              lastName: orderData.shipping.lastName,
              address1: orderData.shipping.address,
              city: orderData.shipping.city,
              state: orderData.shipping.state,
              postal_code: orderData.shipping.zipCode,
              country: orderData.shipping.country,
              phone: orderData.shipping.phone
            },
            payment_status: 'paid',
            fulfillment_status: 'not_fulfilled',
            status: 'pending',
            metadata: {
              payment_provider: 'braintree',
              shipping_method: 'standard'
            },
            transaction_id: orderData.transaction_id,
            email: orderData.shipping.email,
            currency_code: 'USD',
            tax_total: this.formatPrice(0, true), // Add tax calculation if needed
            shipping_total: this.formatPrice(0, true), // Add shipping calculation if needed
            subtotal: this.formatPrice(orderData.total, true),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await setDoc(newOrderRef, order);

          // Update user's orders list
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userOrders = userDoc.data().orders || [];
            await updateDoc(userRef, {
              orders: [...userOrders, order.id]
            });
          }

          return { order };
        } catch (error) {
          console.error('Error creating order:', error);
          throw new Error('Failed to create order. Please try again.');
        }
      },

      update: async (orderId, updateData) => {
        try {
          await this.checkAdminStatus();
          
          const orderRef = doc(this.db, 'orders', orderId);
          const orderDoc = await getDoc(orderRef);
          
          if (!orderDoc.exists()) {
            throw new Error('Order not found');
          }

          const priceUpdates = {};
          if (updateData.total) priceUpdates.total = this.formatPrice(updateData.total, true);
          if (updateData.tax_total) priceUpdates.tax_total = this.formatPrice(updateData.tax_total, true);
          if (updateData.shipping_total) priceUpdates.shipping_total = this.formatPrice(updateData.shipping_total, true);
          if (updateData.subtotal) priceUpdates.subtotal = this.formatPrice(updateData.subtotal, true);

          const updatedOrder = {
            ...orderDoc.data(),
            ...updateData,
            ...priceUpdates,
            updatedAt: new Date().toISOString()
          };

          await updateDoc(orderRef, updatedOrder);
          return { order: updatedOrder };
        } catch (error) {
          console.error('Error updating order:', error);
          throw new Error('Failed to update order. Please try again.');
        }
      },

      retrieve: async (orderId) => {
        try {
          await this.checkAdminStatus();
          
          const orderRef = doc(this.db, 'orders', orderId);
          const orderDoc = await getDoc(orderRef);
          
          if (!orderDoc.exists()) {
            throw new Error('Order not found');
          }

          const orderData = orderDoc.data();
          let customer = null;
          
          if (orderData.customerId) {
            const customerRef = doc(this.db, 'Users', orderData.customerId);
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
              customer,
              total: this.formatPrice(orderData.total || 0),
              tax_total: this.formatPrice(orderData.tax_total || 0),
              shipping_total: this.formatPrice(orderData.shipping_total || 0),
              subtotal: this.formatPrice(orderData.subtotal || 0)
            }
          };
        } catch (error) {
          console.error('Error retrieving order:', error);
          throw new Error('Failed to retrieve order. Please try again.');
        }
      },

      fulfillOrder: async (orderId) => {
        try {
          await this.checkAdminStatus();
          
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
          throw new Error('Failed to fulfill order. Please try again.');
        }
      }
    },

    customers: {
      list: async () => {
        try {
          await this.checkAdminStatus();
          
          const usersRef = collection(this.db, 'Users');
          const usersQuery = query(usersRef, where('hasOrdered', '==', true));
          const snapshot = await getDocs(usersQuery);
          
          const customers = await Promise.all(snapshot.docs.map(async doc => {
            const userData = doc.data();
            
            // Get customer's orders
            const ordersRef = collection(this.db, 'orders');
            const ordersQuery = query(ordersRef, where('customerId', '==', doc.id));
            const ordersSnapshot = await getDocs(ordersQuery);
            
            return {
              id: doc.id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              phone: userData.phone,
              createdAt: userData.createdAt,
              orders: ordersSnapshot.docs.map(order => ({
                id: order.id,
                ...order.data()
              })),
              shippingAddresses: userData.shippingAddresses || []
            };
          }));

          return { customers };
        } catch (error) {
          console.error('Error listing customers:', error);
          throw new Error('Failed to load customers');
        }
      },

      retrieve: async (customerId) => {
        try {
          await this.checkAdminStatus();
          
          const userRef = doc(this.db, 'Users', customerId);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            throw new Error('Customer not found');
          }

          const userData = userDoc.data();
          
          const ordersRef = collection(this.db, 'orders');
          const ordersQuery = query(ordersRef, where('customerId', '==', customerId));
          const ordersSnapshot = await getDocs(ordersQuery);

          return {
            customer: {
              id: userDoc.id,
              ...userData,
              orders: ordersSnapshot.docs.map(order => ({
                id: order.id,
                ...order.data()
              }))
            }
          };
        } catch (error) {
          console.error('Error retrieving customer:', error);
          throw new Error('Failed to load customer details');
        }
      }
    },

    products: {
      create: async (productData) => {
        try {
          await this.checkAdminStatus();
          
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
          throw new Error('Failed to create product. Please try again.');
        }
      },

      update: async (productId, updateData) => {
        try {
          await this.checkAdminStatus();
          
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
          throw new Error('Failed to update product. Please try again.');
        }
      },

      delete: async (productId) => {
        try {
          await this.checkAdminStatus();
          
          const productRef = doc(this.db, 'products', productId);
          await deleteDoc(productRef);
          return { id: productId };
        } catch (error) {
          console.error('Error deleting product:', error);
          throw new Error('Failed to delete product. Please try again.');
        }
      },

      list: async () => {
        try {
          await this.checkAdminStatus();

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
          throw new Error('Failed to list products. Please try again.');
        }
      }
    }
  };

  products = {
    list: async ({ limit = 100, fields = [], expand = [] }) => {
      try {
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
        const user = await this.getCurrentUser();

        const ordersRef = collection(this.db, 'orders');
        const ordersQuery = query(
          ordersRef,
          where('customerId', '==', user.uid),
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
        throw new Error('Failed to list orders. Please try again.');
      }
    },

    retrieve: async (orderId) => {
      try {
        const user = await this.getCurrentUser();
        
        const orderRef = doc(this.db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);
        
        if (!orderDoc.exists()) {
          throw new Error('Order not found');
        }

        const data = orderDoc.data();
        
        if (data.customerId !== user.uid) {
          throw new Error('Access denied');
        }

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
        if (error.message === 'Access denied') {
          throw new Error('Access denied. You can only view your own orders.');
        }
        throw new Error('Failed to retrieve order. Please try again.');
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