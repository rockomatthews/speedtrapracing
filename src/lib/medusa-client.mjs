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
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';

class MedusaFirebaseClient {
  constructor() {
    if (!db) {
      throw new Error('Firebase DB not initialized');
    }
    this.db = db;

    // Bind all admin methods to maintain proper 'this' context
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
  }

  // Helper Methods
  formatPrice(price, toCents = false) {
    if (toCents) {
      return parseInt(parseFloat(price) * 100);
    }
    return parseFloat(price) / 100;
  }

  createHandle(title) {
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

  validateOrderData(orderData) {
    const requiredFields = ['items', 'shipping', 'total'];
    const missingFields = requiredFields.filter(field => !orderData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    const requiredShippingFields = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'zipCode', 'country'];
    const missingShippingFields = requiredShippingFields.filter(field => !orderData.shipping[field]);
    
    if (missingShippingFields.length > 0) {
      throw new Error(`Missing required shipping fields: ${missingShippingFields.join(', ')}`);
    }
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
              subtotal: this.formatPrice(data.subtotal || 0),
              items: (data.items || []).map(item => ({
                ...item,
                unit_price: this.formatPrice(item.unit_price || 0),
                total: this.formatPrice(item.total || 0)
              }))
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
          this.validateOrderData(orderData);
          
          const user = await this.getCurrentUser();
          const ordersRef = collection(this.db, 'orders');
          const newOrderRef = doc(ordersRef);
          
          const userRef = doc(this.db, 'Users', user.uid);
          await updateDoc(userRef, {
            firstName: orderData.shipping.firstName,
            lastName: orderData.shipping.lastName,
            email: orderData.shipping.email,
            phone: orderData.shipping.phone || null,
            hasOrdered: true,
            shippingAddresses: arrayUnion({
              address1: orderData.shipping.address,
              address2: orderData.shipping.address2 || null,
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
              address2: orderData.shipping.address2 || null,
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
              payment_provider: orderData.payment_provider || 'braintree',
              shipping_method: orderData.shipping_method || 'standard'
            },
            transaction_id: orderData.transaction_id,
            email: orderData.shipping.email,
            currency_code: 'USD',
            tax_total: this.formatPrice(orderData.tax_total || 0, true),
            shipping_total: this.formatPrice(orderData.shipping_total || 0, true),
            subtotal: this.formatPrice(orderData.total, true),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await setDoc(newOrderRef, order);

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
          throw new Error(error.message || 'Failed to create order. Please try again.');
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
          throw new Error(error.message || 'Failed to update order. Please try again.');
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
              subtotal: this.formatPrice(orderData.subtotal || 0),
              items: (orderData.items || []).map(item => ({
                ...item,
                unit_price: this.formatPrice(item.unit_price || 0),
                total: this.formatPrice(item.total || 0)
              }))
            }
          };
        } catch (error) {
          console.error('Error retrieving order:', error);
          throw new Error(error.message || 'Failed to retrieve order. Please try again.');
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
          throw new Error(error.message || 'Failed to fulfill order. Please try again.');
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
            
            const ordersRef = collection(this.db, 'orders');
            const ordersQuery = query(ordersRef, where('customerId', '==', doc.id));
            const ordersSnapshot = await getDocs(ordersQuery);
            
            const formattedOrders = ordersSnapshot.docs.map(order => {
              const orderData = order.data();
              return {
                id: order.id,
                ...orderData,
                total: this.formatPrice(orderData.total || 0),
                tax_total: this.formatPrice(orderData.tax_total || 0),
                shipping_total: this.formatPrice(orderData.shipping_total || 0),
                subtotal: this.formatPrice(orderData.subtotal || 0),
                items: (orderData.items || []).map(item => ({
                  ...item,
                  unit_price: this.formatPrice(item.unit_price || 0),
                  total: this.formatPrice(item.total || 0)
                }))
              };
            });

            const totalOrders = formattedOrders.length;
            const totalSpent = formattedOrders.reduce((sum, order) => 
              sum + parseFloat(order.total), 0
            );

            return {
              id: doc.id,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              phone: userData.phone || '',
              createdAt: userData.createdAt || '',
              updatedAt: userData.updatedAt || '',
              orders: formattedOrders,
              shippingAddresses: userData.shippingAddresses || [],
              metrics: {
                totalOrders,
                totalSpent: totalSpent.toFixed(2),
                lastOrderDate: formattedOrders[0]?.createdAt || null
              }
            };
          }));

          return { 
            customers: customers.sort((a, b) => 
              new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
            )
          };
        } catch (error) {
          console.error('Error listing customers:', error);
          if (error.message.includes('admin privileges')) {
            throw new Error('Access denied. Admin privileges required.');
          }
          throw new Error('Failed to load customers. Please try again.');
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
          const ordersQuery = query(
            ordersRef, 
            where('customerId', '==', customerId),
            orderBy('createdAt', 'desc')
          );
          const ordersSnapshot = await getDocs(ordersQuery);

          const formattedOrders = ordersSnapshot.docs.map(order => {
            const orderData = order.data();
            return {
              id: order.id,
              ...orderData,
              total: this.formatPrice(orderData.total || 0),
              tax_total: this.formatPrice(orderData.tax_total || 0),
              shipping_total: this.formatPrice(orderData.shipping_total || 0),
              subtotal: this.formatPrice(orderData.subtotal || 0),
              items: (orderData.items || []).map(item => ({
                ...item,
                unit_price: this.formatPrice(item.unit_price || 0),
                total: this.formatPrice(item.total || 0)
              }))
            };
          });

          const totalOrders = formattedOrders.length;
          const totalSpent = formattedOrders.reduce((sum, order) => 
            sum + parseFloat(order.total), 0
          );

          return {
            customer: {
              id: userDoc.id,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              phone: userData.phone || '',
              createdAt: userData.createdAt || '',
              updatedAt: userData.updatedAt || '',
              orders: formattedOrders,
              shippingAddresses: userData.shippingAddresses || [],
              metrics: {
                totalOrders,
                totalSpent: totalSpent.toFixed(2),
                lastOrderDate: formattedOrders[0]?.createdAt || null,
                averageOrderValue: totalOrders > 0 
                  ? (totalSpent / totalOrders).toFixed(2) 
                  : '0.00'
              },
              hasOrdered: userData.hasOrdered || false,
              isAdmin: userData.isAdmin || false,
              displayName: userData.displayName || '',
              photoURL: userData.photoURL || null
            }
          };
        } catch (error) {
          console.error('Error retrieving customer:', error);
          if (error.message.includes('admin privileges')) {
            throw new Error('Access denied. Admin privileges required.');
          }
          throw new Error('Failed to load customer details. Please try again.');
        }
      },

      update: async (customerId, updateData) => {
        try {
          await this.checkAdminStatus();
          
          const userRef = doc(this.db, 'Users', customerId);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            throw new Error('Customer not found');
          }

          const allowedUpdates = [
            'firstName',
            'lastName',
            'email',
            'phone',
            'shippingAddresses'
          ];

          const updates = Object.keys(updateData)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
              obj[key] = updateData[key];
              return obj;
            }, {});

          updates.updatedAt = new Date().toISOString();

          await updateDoc(userRef, updates);

          const updatedDoc = await getDoc(userRef);
          return {
            customer: {
              id: updatedDoc.id,
              ...updatedDoc.data()
            }
          };
        } catch (error) {
          console.error('Error updating customer:', error);
          throw new Error(error.message || 'Failed to update customer. Please try again.');
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
          
          const products = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              variants: (data.variants || []).map(variant => ({
                ...variant,
                prices: variant.prices.map(price => ({
                  ...price,
                  amount: this.formatPrice(price.amount)
                }))
              }))
            };
          });

          return { products };
        } catch (error) {
          console.error('Error listing products:', error);
          throw new Error('Failed to load products. Please try again.');
        }
      },

      create: async (productData) => {
        try {
          await this.checkAdminStatus();
          
          const productsRef = collection(this.db, 'products');
          const productRef = doc(productsRef);

          const product = {
            id: productRef.id,
            title: productData.title,
            description: productData.description,
            handle: this.createHandle(productData.title),
            variants: [{
              id: `${productRef.id}-default`,
              title: productData.title,
              prices: [{
                amount: this.formatPrice(productData.price, true),
                currency_code: 'USD'
              }],
              inventory_quantity: parseInt(productData.inventory || '0')
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

          const updatedProduct = {
            ...productDoc.data(),
            ...updateData,
            updatedAt: new Date().toISOString()
          };

          if (updateData.price) {
            updatedProduct.variants = updatedProduct.variants.map(variant => ({
              ...variant,
              prices: [{
                amount: this.formatPrice(updateData.price, true),
                currency_code: 'USD'
              }]
            }));
          }

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
      }
    }
  };

  products = {
    list: async ({ limit = 100, fields = [], expand = [] } = {}) => {
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
          
          const formattedVariants = variants.map(variant => ({
            ...variant,
            prices: variant.prices.map(price => ({
              ...price,
              amount: this.formatPrice(price.amount)
            }))
          }));

          return {
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            handle: data.handle || this.createHandle(data.title || ''),
            category: data.category || 'Uncategorized',
            size: data.size || '',
            inventory: data.inventory || '0',
            images: data.images || [],
            thumbnail: data.thumbnail || '',
            variants: formattedVariants,
            metadata: data.metadata || {},
            status: data.status || 'published',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
          };
        });

        const publishedProducts = products.filter(p => p.status === 'published');
        return { products: publishedProducts };
      } catch (error) {
        console.error('Error listing products:', error);
        throw new Error('Failed to load products. Please try again.');
      }
    },

    retrieve: async (productId) => {
      try {
        const productRef = doc(this.db, 'products', productId);
        const productDoc = await getDoc(productRef);
        
        if (!productDoc.exists()) {
          throw new Error('Product not found');
        }

        const data = productDoc.data();

        const product = {
          id: productDoc.id,
          ...data,
          variants: (data.variants || []).map(variant => ({
            ...variant,
            prices: variant.prices.map(price => ({
              ...price,
              amount: this.formatPrice(price.amount)
            }))
          }))
        };

        if (product.status !== 'published') {
          throw new Error('Product not found');
        }

        return { product };
      } catch (error) {
        console.error('Error retrieving product:', error);
        throw new Error(error.message || 'Failed to retrieve product. Please try again.');
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
        throw new Error('Failed to load orders. Please try again.');
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
  }
} // End of MedusaFirebaseClient class

// Create instance and export
let medusaClient = new MedusaFirebaseClient();
export default medusaClient;