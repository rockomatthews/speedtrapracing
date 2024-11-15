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
  getDoc 
} from 'firebase/firestore';

class MedusaFirebaseClient {
  constructor() {
    if (!db) {
      throw new Error('Firebase DB not initialized');
    }
    this.db = db;
  }

  admin = {
    products: {
      create: async (productData) => {
        try {
          if (!this.db) throw new Error('Firebase DB not initialized');
          
          const productsRef = collection(this.db, 'products');
          const newProductRef = doc(productsRef);
          
          // Convert price to cents for storage
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
          // Ensure we always have a valid variants array with prices
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

  createHandle(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

const medusaClient = new MedusaFirebaseClient();
export default medusaClient;