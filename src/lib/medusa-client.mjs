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
              return { orders: [] };
            }
            
            const validOrders = [];
            for (const doc of snapshot.docs) {
              const order = await this.formatTransactionToOrder(doc);
              if (order !== null) {
                validOrders.push(order);
              }
            }
            
            return { orders: validOrders };
          } catch (error) {
            console.error('[Orders Debug] Error listing orders:', error);
            return { orders: [] };
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

      const userRef = doc(this.db, 'Users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      
      if (!userData || !userData.isAdmin || userData.role !== 'admin') {
        throw new Error('User does not have admin privileges');
      }
      
      return user;
    } catch (error) {
      console.error('[Admin Debug] Error checking admin status:', error);
      throw error;
    }
  }

  async formatTransactionToOrder(transactionDoc) {
    if (!transactionDoc) return null;
    
    const data = transactionDoc.data();
    
    if (!data?.data) return null;
  
    return {
      id: transactionDoc.id,
      customerId: data.data.userId || '',
      customer: {
        email: data.data.customerEmail || data.data.shipping?.email || '',
        firstName: data.data.shipping?.firstName || '',
        lastName: data.data.shipping?.lastName || '',
        phone: data.data.shipping?.phone || ''
      },
      shipping_address: {
        firstName: data.data.shipping?.firstName || '',
        lastName: data.data.shipping?.lastName || '',
        address1: data.data.shipping?.address || '',
        address2: data.data.shipping?.address2 || '',
        city: data.data.shipping?.city || '',
        state: data.data.shipping?.state || '',
        postal_code: data.data.shipping?.zipCode || '',
        country: data.data.shipping?.country || '',
        phone: data.data.shipping?.phone || ''
      },
      total: parseInt(data.data.amount || 0, 10),
      subtotal: parseInt(data.data.amount || 0, 10),
      tax_total: parseInt(data.data.tax_total || 0, 10),
      shipping_total: parseInt(data.data.shipping_total || 0, 10),
      itemCount: parseInt(data.data.itemCount || 0, 10),
      status: data.status === 'success' ? 'completed' : 'pending',
      payment_status: data.status === 'success' ? 'paid' : 'pending',
      createdAt: data.timestamp?.toDate() || new Date(),
      updatedAt: data.timestamp?.toDate() || new Date(),
      environment: data.data.environment || 'production',
      isGuest: data.data.isGuest || data.data.userId === 'guest'
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
}

const client = new MedusaFirebaseClient();
export default client;