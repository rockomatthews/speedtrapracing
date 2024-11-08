const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, collection, query, getDocs, orderBy } = require('firebase/firestore');

// Complete Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase application
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
          price: (productData.variants[0].prices[0].amount / 100).toString(),
          currency: productData.variants[0].prices[0].currency_code,
          category: productData.categories ? productData.categories[0] : "Uncategorized",
          inventory: productData.variants[0].inventory_quantity.toString(),
          size: productData.options[0].values[0],
          images: [
            {
              src: productData.images[0],
              alt: productData.title
            }
          ],
          thumbnail: productData.thumbnail,
          handle: productData.handle,
          variants: [
            {
              id: `${newProductRef.id}-default`,
              title: productData.variants[0].title,
              price: (productData.variants[0].prices[0].amount / 100).toString(),
              currency: productData.variants[0].prices[0].currency_code,
              inventory_quantity: productData.variants[0].inventory_quantity
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
  }
};

// Export the ecommerce object
module.exports = ecommerce;