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

          const product = {
            id: newProductRef.id,
            title: productData.title,
            description: productData.description,
            price: productData.price || '0',
            currency: 'USD',
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
            variants: productData.variants || [{
              id: `${newProductRef.id}-default`,
              title: productData.title,
              price: productData.price,
              inventory_quantity: productData.inventory
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            medusa_id: productData.medusa_id || null
          };

          await setDoc(newProductRef, product);
          return { product };
        } catch (error) {
          console.error('Error creating product:', error);
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
          return {
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            price: data.price || '0',
            currency: data.currency || 'USD',
            category: data.category || 'Uncategorized',
            size: data.size || '',
            inventory: data.inventory || '0',
            images: data.images || [],
            thumbnail: data.thumbnail || '',
            handle: data.handle || '',
            variants: data.variants || [],
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
          };
        });

        return { products };
      } catch (error) {
        console.error('Error listing products:', error);
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

// Create a single instance
const medusaClient = new MedusaFirebaseClient();
export default medusaClient;