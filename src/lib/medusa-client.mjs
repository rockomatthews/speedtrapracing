import { db } from './firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
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
  arrayUnion,
  serverTimestamp,
  limit
} from 'firebase/firestore';

class MedusaFirebaseClient {
  constructor() {
    if (!db) {
      throw new Error('Firebase DB not initialized');
    }
    
    this.db = db;
    this.formatPrice = this.formatPrice.bind(this);
    this.createHandle = this.createHandle.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.checkAdminStatus = this.checkAdminStatus.bind(this);
    this.formatTransactionToOrder = this.formatTransactionToOrder.bind(this);
    this.formatTransactionToCustomer = this.formatTransactionToCustomer.bind(this);

    this.products = {
      list: async ({ limit: queryLimit = 100 } = {}) => {
        try {
          const productsRef = collection(this.db, 'products');
          const productsQuery = query(
            productsRef, 
            orderBy('createdAt', 'desc'),
            limit(queryLimit)
          );
          
          const snapshot = await getDocs(productsQuery);
          
          console.log('[Products Debug] Query response:', {
            empty: snapshot.empty,
            size: snapshot.size
          });
    
          if (snapshot.empty) {
            return { products: [] };
          }
    
          const products = [];
          for (const doc of snapshot.docs) {
            const data = doc.data();
            if (data) {
              products.push({
                id: doc.id,
                title: data.title || '',
                description: data.description || '',
                handle: data.handle || '',
                status: data.status || 'draft',
                images: data.images || [],
                thumbnail: data.thumbnail || '',
                variants: (data.variants || []).map(variant => ({
                  id: variant.id || '',
                  title: variant.title || '',
                  inventory_quantity: parseInt(variant.inventory_quantity || 0, 10),
                  prices: (variant.prices || []).map(price => ({
                    amount: parseInt(price.amount || 0, 10),
                    currency_code: price.currency_code || 'USD'
                  }))
                }))
              });
            }
          }
    
          console.log('[Products Debug] Final products:', products);
          return { products };
        } catch (error) {
          console.error('[Products Debug] Error listing products:', error);
          return { products: [] };
        }
      }
    };

    this.admin = {
      orders: {
        list: async () => {
          try {
            console.log('[Orders Debug] Starting order list fetch');
            await this.checkAdminStatus();
            
            const logsRef = collection(this.db, 'transaction_logs');
            
            // First, let's see ALL recent transactions
            const allTransactionsQuery = query(
              logsRef,
              orderBy('timestamp', 'desc'),
              limit(20)
            );
            
            const allSnapshot = await getDocs(allTransactionsQuery);
            console.log('[Orders Debug] All recent transactions:', 
              allSnapshot.docs.map(doc => ({
                id: doc.id,
                type: doc.data().type,
                status: doc.data().status,
                amount: doc.data().data?.amount,
                timestamp: doc.data().timestamp?.toDate()
              }))
            );

            // Now let's check completed transactions
            const completedQuery = query(
              logsRef,
              where('type', 'in', ['checkout_initiated', 'checkout_completed']),
              orderBy('timestamp', 'desc')
            );
            
            const snapshot = await getDocs(completedQuery);
            console.log('[Orders Debug] Completed transactions:', 
              snapshot.docs.map(doc => ({
                id: doc.id,
                type: doc.data().type,
                status: doc.data().status,
                amount: doc.data().data?.amount,
                timestamp: doc.data().timestamp?.toDate()
              }))
            );
            
            if (snapshot.empty) {
              return { orders: [], total: 0 };
            }
            
            const validOrders = [];
            let totalAmount = 0;
            
            for (const doc of snapshot.docs) {
              const data = doc.data();
              // Include both successful and completed transactions
              if (data.status === 'success' || data.type === 'checkout_completed') {
                const order = await this.formatTransactionToOrder(doc);
                if (order !== null) {
                  validOrders.push(order);
                  totalAmount += order.total;
                }
              }
            }
            
            console.log('[Orders Debug] Final processed orders:', {
              count: validOrders.length,
              orders: validOrders.map(o => ({
                id: o.id,
                status: o.status,
                amount: o.display_amount,
                timestamp: o.createdAt
              }))
            });
            
            return { 
              orders: validOrders,
              total: totalAmount
            };
          } catch (error) {
            console.error('[Orders Debug] Error in list method:', error);
            return { orders: [], total: 0 };
          }
        },

        create: async (orderData) => {
          try {
            await this.checkAdminStatus();
            
            if (!orderData || !orderData.shipping || !orderData.items) {
              return { order: null };
            }

            const logsRef = collection(this.db, 'transaction_logs');
            const newLogRef = doc(logsRef);

            const transactionLog = {
              type: 'checkout_initiated',
              status: 'success',
              timestamp: serverTimestamp(),
              data: {
                userId: orderData.customerId || '',
                customerEmail: orderData.shipping.email || '',
                amount: orderData.total || 0,
                shipping: {
                  firstName: orderData.shipping.firstName || '',
                  lastName: orderData.shipping.lastName || '',
                  email: orderData.shipping.email || '',
                  phone: orderData.shipping.phone || '',
                  address: orderData.shipping.address || '',
                  address2: orderData.shipping.address2 || '',
                  city: orderData.shipping.city || '',
                  state: orderData.shipping.state || '',
                  zipCode: orderData.shipping.zipCode || '',
                  country: orderData.shipping.country || ''
                },
                itemCount: orderData.items.length,
                environment: 'production',
                isGuest: orderData.customerId ? false : true
              }
            };

            await setDoc(newLogRef, transactionLog);
            
            const formattedOrder = await this.formatTransactionToOrder({
              id: newLogRef.id,
              data: () => transactionLog
            });

            return { order: formattedOrder };
          } catch (error) {
            console.error('[Orders Debug] Error creating order:', error);
            return { order: null };
          }
        },

        update: async (orderId, updateData) => {
          try {
            await this.checkAdminStatus();
            
            if (!orderId) {
              return { order: null };
            }

            const logRef = doc(this.db, 'transaction_logs', orderId);
            const logDoc = await getDoc(logRef);
            
            if (!logDoc.exists()) {
              return { order: null };
            }

            const currentData = logDoc.data();
            const updatedData = {
              ...currentData,
              data: {
                ...currentData.data,
                ...updateData,
                amount: updateData.total || currentData.data.amount
              },
              timestamp: serverTimestamp()
            };

            await updateDoc(logRef, updatedData);
            
            const formattedOrder = await this.formatTransactionToOrder({
              id: orderId,
              data: () => updatedData
            });

            return { order: formattedOrder };
          } catch (error) {
            console.error('[Orders Debug] Error updating order:', error);
            return { order: null };
          }
        },

        retrieve: async (orderId) => {
          try {
            await this.checkAdminStatus();
            
            if (!orderId) {
              return { order: null };
            }

            const logRef = doc(this.db, 'transaction_logs', orderId);
            const logDoc = await getDoc(logRef);
            
            if (!logDoc.exists()) {
              return { order: null };
            }

            const formattedOrder = await this.formatTransactionToOrder(logDoc);
            return { order: formattedOrder };
          } catch (error) {
            console.error('[Orders Debug] Error retrieving order:', error);
            return { order: null };
          }
        },

        fulfillOrder: async (orderId) => {
          try {
            await this.checkAdminStatus();
            
            if (!orderId) {
              return { order: null };
            }

            const logRef = doc(this.db, 'transaction_logs', orderId);
            const logDoc = await getDoc(logRef);
            
            if (!logDoc.exists()) {
              return { order: null };
            }

            const currentData = logDoc.data();
            const updatedData = {
              ...currentData,
              status: 'success',
              data: {
                ...currentData.data,
                fulfillmentStatus: 'fulfilled'
              },
              timestamp: serverTimestamp()
            };

            await updateDoc(logRef, updatedData);
            
            const formattedOrder = await this.formatTransactionToOrder({
              id: orderId,
              data: () => updatedData
            });

            return { order: formattedOrder };
          } catch (error) {
            console.error('[Orders Debug] Error fulfilling order:', error);
            return { order: null };
          }
        }
      },

      customers: {
        list: async () => {
          try {
            await this.checkAdminStatus();
            
            const logsRef = collection(this.db, 'transaction_logs');
            const logsQuery = query(
              logsRef, 
              where('type', '==', 'checkout_initiated'),
              where('status', '==', 'success'),
              orderBy('timestamp', 'desc')
            );
            
            const snapshot = await getDocs(logsQuery);
            
            if (snapshot.empty) {
              return { customers: [] };
            }

            const transactionsByUser = {};
            for (const doc of snapshot.docs) {
              const data = doc.data();
              if (data?.data?.userId || data?.data?.customerEmail) {
                const userKey = data.data.userId || data.data.customerEmail;
                if (!transactionsByUser[userKey]) {
                  transactionsByUser[userKey] = [];
                }
                transactionsByUser[userKey].push(doc);
              }
            }

            const validCustomers = [];
            for (const [userId, transactions] of Object.entries(transactionsByUser)) {
              const customer = await this.formatTransactionToCustomer(transactions, userId);
              if (customer !== null) {
                validCustomers.push(customer);
              }
            }

            return { 
              customers: validCustomers.sort((a, b) => {
                const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
                const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
                return dateB - dateA;
              })
            };
          } catch (error) {
            console.error('[Customers Debug] Error listing customers:', error);
            return { customers: [] };
          }
        },

        retrieve: async (customerId) => {
          try {
            await this.checkAdminStatus();
            
            if (!customerId) {
              return { customer: null };
            }

            const logsRef = collection(this.db, 'transaction_logs');
            const logsQuery = query(
              logsRef,
              where('data.userId', '==', customerId),
              where('type', '==', 'checkout_initiated'),
              where('status', '==', 'success'),
              orderBy('timestamp', 'desc')
            );

            const snapshot = await getDocs(logsQuery);
            
            if (snapshot.empty) {
              const emailQuery = query(
                logsRef,
                where('data.customerEmail', '==', customerId),
                where('type', '==', 'checkout_initiated'),
                where('status', '==', 'success'),
                orderBy('timestamp', 'desc')
              );
              const emailSnapshot = await getDocs(emailQuery);
              
              if (emailSnapshot.empty) {
                return { customer: null };
              }
              
              const customer = await this.formatTransactionToCustomer(emailSnapshot.docs, customerId);
              return { customer };
            }

            const customer = await this.formatTransactionToCustomer(snapshot.docs, customerId);
            return { customer };
          } catch (error) {
            console.error('[Customers Debug] Error retrieving customer:', error);
            return { customer: null };
          }
        },

        create: async (customerData) => {
          try {
            await this.checkAdminStatus();
            
            if (!customerData || !customerData.email) {
              return { customer: null };
            }

            const logsRef = collection(this.db, 'transaction_logs');
            const newLogRef = doc(logsRef);

            const customerLog = {
              type: 'checkout_initiated',
              status: 'success',
              timestamp: serverTimestamp(),
              data: {
                customerEmail: customerData.email,
                shipping: {
                  firstName: customerData.first_name || '',
                  lastName: customerData.last_name || '',
                  email: customerData.email,
                  phone: customerData.phone || '',
                  address: '',
                  city: '',
                  state: '',
                  zipCode: '',
                  country: 'US'
                },
                environment: 'production',
                isGuest: true,
                itemCount: 0,
                amount: 0
              }
            };

            await setDoc(newLogRef, customerLog);
            
            const mockTransaction = {
              id: newLogRef.id,
              data: function() {
                return customerLog;
              }
            };

            const customer = await this.formatTransactionToCustomer([mockTransaction], customerData.email);
            return { customer };
          } catch (error) {
            console.error('[Customers Debug] Error creating customer:', error);
            return { customer: null };
          }
        },

        update: async (customerId, updateData) => {
          try {
            await this.checkAdminStatus();
            
            if (!customerId || !updateData) {
              return { customer: null };
            }

            const logsRef = collection(this.db, 'transaction_logs');
            const logsQuery = query(
              logsRef,
              where('data.customerEmail', '==', customerId),
              where('type', '==', 'checkout_initiated'),
              where('status', '==', 'success'),
              orderBy('timestamp', 'desc')
            );

            const snapshot = await getDocs(logsQuery);
            
            if (snapshot.empty) {
              return this.admin.customers.create({
                email: customerId,
                first_name: updateData.first_name,
                last_name: updateData.last_name,
                phone: updateData.phone
              });
            }

            const latestLog = snapshot.docs[0];
            const logRef = doc(this.db, 'transaction_logs', latestLog.id);
            
            const currentData = latestLog.data();
            const updatedLog = {
              ...currentData,
              data: {
                ...currentData.data,
                shipping: {
                  ...currentData.data.shipping,
                  firstName: updateData.first_name || currentData.data.shipping.firstName,
                  lastName: updateData.last_name || currentData.data.shipping.lastName,
                  phone: updateData.phone || currentData.data.shipping.phone
                }
              },
              timestamp: serverTimestamp()
            };

            await updateDoc(logRef, updatedLog);

            const customer = await this.formatTransactionToCustomer(snapshot.docs, customerId);
            return { customer };
          } catch (error) {
            console.error('[Customers Debug] Error updating customer:', error);
            return { customer: null };
          }
        }
      },

      products: {
        list: async () => {
          try {
            await this.checkAdminStatus();
            
            const productsRef = collection(this.db, 'products');
            const productsQuery = query(productsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(productsQuery);
            
            if (snapshot.empty) {
              return { products: [] };
            }
      
            const products = [];
            for (const doc of snapshot.docs) {
              const data = doc.data();
              if (data) {
                products.push({
                  id: doc.id,
                  title: data.title || '',
                  description: data.description || '',
                  handle: data.handle || '',
                  status: data.status || 'draft',
                  images: data.images || [],
                  thumbnail: data.thumbnail || '',
                  createdAt: data.createdAt || new Date().toISOString(),
                  updatedAt: data.updatedAt || new Date().toISOString(),
                  variants: (data.variants || []).map(variant => ({
                    id: variant.id || '',
                    title: variant.title || '',
                    inventory_quantity: parseInt(variant.inventory_quantity || 0, 10),
                    prices: (variant.prices || []).map(price => ({
                      amount: parseInt(price.amount || 0, 10),
                      currency_code: price.currency_code || 'USD'
                    }))
                  }))
                });
              }
            }
      
            return { products };
          } catch (error) {
            console.error('[Products Debug] Error listing products:', error);
            return { products: [] };
          }
        },
      
        create: async (productData) => {
          try {
            await this.checkAdminStatus();
            
            if (!productData || !productData.title) {
              return { product: null };
            }
      
            const productsRef = collection(this.db, 'products');
            const productRef = doc(productsRef);
      
            const product = {
              id: productRef.id,
              title: productData.title,
              description: productData.description || '',
              handle: this.createHandle(productData.title),
              variants: [{
                id: `${productRef.id}-default`,
                title: productData.title,
                prices: [{
                  amount: parseInt(productData.price || 0, 10),
                  currency_code: 'USD'
                }],
                inventory_quantity: parseInt(productData.inventory || '0', 10)
              }],
              status: 'draft',
              images: productData.images || [],
              thumbnail: productData.thumbnail || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
      
            await setDoc(productRef, product);
            return { product };
          } catch (error) {
            console.error('[Products Debug] Error creating product:', error);
            return { product: null };
          }
        },
      
        update: async (productId, updateData) => {
          try {
            await this.checkAdminStatus();
            
            if (!productId || !updateData) {
              return { product: null };
            }
      
            const productRef = doc(this.db, 'products', productId);
            const productDoc = await getDoc(productRef);
            
            if (!productDoc.exists()) {
              return { product: null };
            }
      
            const currentData = productDoc.data();
            const updatedProduct = {
              ...currentData,
              ...updateData,
              updatedAt: new Date().toISOString()
            };
      
            if (updateData.price) {
              updatedProduct.variants = (updatedProduct.variants || []).map(variant => ({
                ...variant,
                prices: [{
                  amount: parseInt(updateData.price || 0, 10),
                  currency_code: 'USD'
                }]
              }));
            }
      
            await updateDoc(productRef, updatedProduct);
            return { product: updatedProduct };
          } catch (error) {
            console.error('[Products Debug] Error updating product:', error);
            return { product: null };
          }
        },
      
        delete: async (productId) => {
          try {
            await this.checkAdminStatus();
            
            if (!productId) {
              return { success: false };
            }
      
            const productRef = doc(this.db, 'products', productId);
            await deleteDoc(productRef);
            
            return { success: true, id: productId };
          } catch (error) {
            console.error('[Products Debug] Error deleting product:', error);
            return { success: false };
          }
        }
      }
    };

    this.admin.orders.list = this.admin.orders.list.bind(this);
    this.admin.orders.create = this.admin.orders.create.bind(this);
    this.admin.orders.update = this.admin.orders.update.bind(this);
    this.admin.orders.retrieve = this.admin.orders.retrieve.bind(this);
    this.admin.orders.fulfillOrder = this.admin.orders.fulfillOrder.bind(this);

    this.admin.customers.list = this.admin.customers.list.bind(this);
    this.admin.customers.retrieve = this.admin.customers.retrieve.bind(this);

    this.admin.products.list = this.admin.products.list.bind(this);
    this.admin.products.create = this.admin.products.create.bind(this);
    this.admin.products.update = this.admin.products.update.bind(this);
    this.admin.products.delete = this.admin.products.delete.bind(this);
    this.products.list = this.products.list.bind(this);
  }

  formatPrice(price) {
    if (typeof price === 'string') {
      return parseInt(price.replace(/[^0-9]/g, ''), 10);
    }
    if (typeof price === 'number') {
      return parseInt(price, 10);
    }
    return 0;
  }

  createHandle(title) {
    if (!title) return '';
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async getCurrentUser() {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    return user;
  }

  async checkAdminStatus() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's ID token to check custom claims
      const idTokenResult = await user.getIdTokenResult();
      
      console.log('[Admin Debug] Token claims:', idTokenResult.claims);

      // Check both possible admin claim formats
      if (!idTokenResult.claims.admin && !idTokenResult.claims.isAdmin) {
        throw new Error('User does not have admin privileges');
      }

      // Also verify against Firestore
      const userDoc = await getDoc(doc(this.db, 'Users', user.uid));
      const userData = userDoc.data();

      if (!userData?.isAdmin) {
        throw new Error('User does not have admin privileges in database');
      }

      return true;
    } catch (error) {
      console.error('[Admin Debug] Error checking admin status:', error);
      throw error;
    }
  }

  async formatTransactionToOrder(transactionDoc) {
    if (!transactionDoc) return null;
    const data = transactionDoc.data();
    
    if (!data?.data) {
      console.log('[Debug] Invalid transaction data structure:', data);
      return null;
    }

    // Keep the original amount as dollars (no conversion needed)
    const amount = data.data.amount;
    const total = typeof amount === 'string' 
      ? parseFloat(amount)  // Just parse the string to number
      : amount;
    
    console.log('[Debug] Amount conversion:', {
      original: amount,
      asNumber: total,
      inCents: total * 100
    });

    return {
      id: transactionDoc.id,
      customerId: data.data.userId || '',
      customer: {
        email: data.data.customerEmail || data.data.shipping?.email || '',
        firstName: data.data.shipping?.firstName || '',
        lastName: data.data.shipping?.lastName || '',
        phone: data.data.shipping?.phone || ''
      },
      total: total * 100, // Convert to cents for internal use
      subtotal: total * 100,
      tax_total: parseInt(data.data.tax_total || 0, 10),
      shipping_total: parseInt(data.data.shipping_total || 0, 10),
      itemCount: parseInt(data.data.itemCount || 0, 10),
      status: data.status === 'success' ? 'completed' : 'pending',
      payment_status: data.status === 'success' ? 'paid' : 'pending',
      createdAt: data.timestamp?.toDate() || new Date(),
      updatedAt: data.timestamp?.toDate() || new Date(),
      // Add display amount for UI
      display_amount: parseFloat(amount).toFixed(2)
    };
  }

  async formatTransactionToCustomer(transactions, userId) {
    if (!transactions?.length || !userId) return null;

    const validTransactions = [];
    for (const transaction of transactions) {
      const order = await this.formatTransactionToOrder(transaction);
      if (order) {
        validTransactions.push(order);
      }
    }

    if (validTransactions.length === 0) return null;

    const latestTransaction = transactions[0].data();
    if (!latestTransaction?.data) return null;

    const totalSpent = validTransactions.reduce((sum, order) => sum + (order.total || 0), 0);

    return {
      id: userId,
      email: latestTransaction.data.customerEmail || latestTransaction.data.shipping?.email || '',
      firstName: latestTransaction.data.shipping?.firstName || '',
      lastName: latestTransaction.data.shipping?.lastName || '',
      phone: latestTransaction.data.shipping?.phone || '',
      createdAt: latestTransaction.timestamp?.toDate() || new Date(),
      updatedAt: latestTransaction.timestamp?.toDate() || new Date(),
      orders: validTransactions,
      shippingAddresses: [{
        address1: latestTransaction.data.shipping?.address || '',
        address2: latestTransaction.data.shipping?.address2 || '',
        city: latestTransaction.data.shipping?.city || '',
        state: latestTransaction.data.shipping?.state || '',
        postal_code: latestTransaction.data.shipping?.zipCode || '',
        country: latestTransaction.data.shipping?.country || ''
      }],
      metrics: {
        totalOrders: validTransactions.length,
        totalSpent: totalSpent,
        lastOrderDate: validTransactions[0]?.createdAt || null,
        averageOrderValue: validTransactions.length > 0 ? Math.round(totalSpent / validTransactions.length) : 0
      }
    };
  }

  async createPaymentSession(cartId) {
    try {
      const response = await fetch(`${this.baseUrl}/carts/${cartId}/payment-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error creating payment session:', error);
      throw error;
    }
  }

  async completeCart(cartId) {
    try {
      console.log('[Cart Debug] Completing cart:', cartId);
      
      // First complete the cart
      const response = await fetch(`${this.baseUrl}/carts/${cartId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      // Find and update the pending transaction
      const logsRef = collection(this.db, 'transaction_logs');
      const pendingQuery = query(
        logsRef,
        where('data.sessionId', '==', cartId),
        where('status', '==', 'pending'),
        where('type', '==', 'checkout_initiated'),
        limit(1)
      );
      
      const snapshot = await getDocs(pendingQuery);
      
      if (!snapshot.empty) {
        const transactionDoc = snapshot.docs[0];
        console.log('[Cart Debug] Updating transaction status:', transactionDoc.id);
        
        await updateDoc(doc(this.db, 'transaction_logs', transactionDoc.id), {
          status: 'success',
          updatedAt: serverTimestamp()
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error completing cart:', error);
      throw error;
    }
  }

  async handleStripeWebhook(event) {
    try {
      console.log('[Webhook Debug] Processing Stripe event:', event.type);
      
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Find and update the pending transaction
        const logsRef = collection(this.db, 'transaction_logs');
        const pendingQuery = query(
          logsRef,
          where('data.sessionId', '==', session.id),
          where('status', '==', 'pending'),
          where('type', '==', 'checkout_initiated'),
          limit(1)
        );
        
        const snapshot = await getDocs(pendingQuery);
        
        if (!snapshot.empty) {
          const transactionDoc = snapshot.docs[0];
          console.log('[Webhook Debug] Updating transaction status:', transactionDoc.id);
          
          await updateDoc(doc(this.db, 'transaction_logs', transactionDoc.id), {
            status: 'success',
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('[Webhook Debug] Error processing webhook:', error);
      throw error;
    }
  }
}

const client = new MedusaFirebaseClient();
export default client;