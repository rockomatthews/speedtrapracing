const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, collection, query, where, getDocs, orderBy } = require('firebase/firestore');

// Initialize Firebase first
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ecommerce = {
  products: {
    create: async (productData) => {
      try {
        // Create a reference to the products collection
        const productsRef = collection(db, 'products');
        const newProductRef = doc(productsRef);
        
        // Transform the Medusa-style data to match your Firebase schema
        const firebaseProduct = {
          title: productData.title,
          description: productData.description,
          price: (productData.variants[0].prices[0].amount / 100).toString(), // Convert cents to dollars
          currency: productData.variants[0].prices[0].currency_code,
          category: productData.categories[0] || "Uncategorized",
          inventory: productData.variants[0].inventory_quantity.toString(),
          size: productData.options[0].values[0],
          images: [{
            src: productData.images[0],
            alt: productData.title
          }],
          thumbnail: productData.thumbnail,
          handle: productData.handle,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await setDoc(newProductRef, firebaseProduct);
        console.log('Product added successfully with ID:', newProductRef.id);
        
        return { 
          products: [{
            id: newProductRef.id,
            ...firebaseProduct
          }]
        };
      } catch (error) {
        console.error('Error creating product:', error);
        throw error;
      }
    },
    
    list: async ({ limit = 100, fields = [], expand = [] }) => {
      try {
        const productsRef = collection(db, 'products');
        const productsQuery = query(productsRef, orderBy('createdAt', 'desc'));
        const productsSnapshot = await getDocs(productsQuery);
        
        const products = productsSnapshot.docs.map(doc => ({
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

module.exports = ecommerce;