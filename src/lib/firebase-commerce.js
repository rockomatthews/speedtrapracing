// src/lib/firebase-commerce.js
import { db } from './firebase';  // Import db from centralized Firebase initialization
import { collection, doc, setDoc, query, getDocs, orderBy } from 'firebase/firestore';

// Complete ecommerce object with all methods
const ecommerce = {
  products: {
    // Method to create a new product
    create: async (productData) => {
      try {
        const productsRef = collection(db, 'products');
        const newProductRef = doc(productsRef);

        // Create the complete product object with all required fields
        const firebaseProduct = {
          id: newProductRef.id,
          title: productData.title,
          description: productData.description,
          price: productData.variants?.[0]?.prices?.[0]?.amount 
            ? (productData.variants[0].prices[0].amount / 100).toString()
            : '0',
          currency: productData.variants?.[0]?.prices?.[0]?.currency_code || 'USD',
          category: productData.categories?.[0] || "Uncategorized",
          inventory: productData.variants?.[0]?.inventory_quantity?.toString() || '0',
          size: productData.options?.[0]?.values?.[0] || '',
          images: [
            {
              src: productData.images?.[0] || '',
              alt: productData.title || ''
            }
          ],
          thumbnail: productData.thumbnail || '',
          handle: productData.handle || '',
          variants: [
            {
              id: `${newProductRef.id}-default`,
              title: productData.variants?.[0]?.title || '',
              price: productData.variants?.[0]?.prices?.[0]?.amount 
                ? (productData.variants[0].prices[0].amount / 100).toString()
                : '0',
              currency: productData.variants?.[0]?.prices?.[0]?.currency_code || 'USD',
              inventory_quantity: productData.variants?.[0]?.inventory_quantity || 0
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Save the product to Firebase
        await setDoc(newProductRef, firebaseProduct);
        
        console.log('Product successfully created with ID:', newProductRef.id);
        console.log('Product data:', firebaseProduct);

        return { 
          products: [firebaseProduct]
        };
      } catch (error) {
        console.error('Error creating product:', error);
        throw error;
      }
    },

    // Method to list all products
    list: async ({ limit = 100, fields = [], expand = [] }) => {
      try {
        // Get reference to products collection
        const productsRef = collection(db, 'products');
        
        // Create query ordered by creation date
        const productsQuery = query(
          productsRef,
          orderBy('createdAt', 'desc')
        );

        // Execute query
        const productsSnapshot = await getDocs(productsQuery);

        // Transform query results to match expected format
        const products = productsSnapshot.docs.map(doc => {
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

        console.log('Products retrieved:', products);

        return { 
          products: products
        };
      } catch (error) {
        console.error('Error listing products:', error);
        throw error;
      }
    }
  },
  
  // Add cart functionality
  carts: {
    create: async (cartData) => {
      try {
        const cartsRef = collection(db, 'carts');
        const newCartRef = doc(cartsRef);

        const firebaseCart = {
          id: newCartRef.id,
          items: cartData.items || [],
          total: cartData.total || 0,
          status: 'created',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await setDoc(newCartRef, firebaseCart);

        return { cart: firebaseCart };
      } catch (error) {
        console.error('Error creating cart:', error);
        throw error;
      }
    }
  }
};

export default ecommerce;