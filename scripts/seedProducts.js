// scripts/seedProducts.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
require('dotenv').config();

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

const sampleProducts = [
  {
    title: "Classic Racing T-Shirt",
    description: "High-quality racing t-shirt made from premium materials. Features a comfortable fit and stylish design.",
    thumbnail: "https://placehold.co/600x400",
    handle: "classic-racing-tshirt",
    collectionTitle: "Apparel", // Simplified from nested object
    variantsList: [ // Renamed from variants to avoid confusion
      {
        variantId: "classic-tshirt-s",
        variantTitle: "Small",
        price: 2999, // Simplified price structure
        currencyCode: "USD",
        inventoryQuantity: 50
      },
      {
        variantId: "classic-tshirt-m",
        variantTitle: "Medium",
        price: 2999,
        currencyCode: "USD",
        inventoryQuantity: 45
      },
      {
        variantId: "classic-tshirt-l",
        variantTitle: "Large",
        price: 2999,
        currencyCode: "USD",
        inventoryQuantity: 30
      }
    ],
    images: [
      {
        src: "https://placehold.co/600x400",
        alt: "Classic Racing T-Shirt"
      }
    ],
    status: "active",
    metadata: {
      category: "Apparel",
      weight: "0.5",
      material: "100% Cotton"
    }
  },
  {
    title: "Racing Team Hoodie",
    description: "Warm and comfortable hoodie perfect for race day or casual wear. Features team logo and premium construction.",
    thumbnail: "https://placehold.co/600x400",
    handle: "racing-team-hoodie",
    collectionTitle: "Apparel",
    variantsList: [
      {
        variantId: "team-hoodie-s",
        variantTitle: "Small",
        price: 5999,
        currencyCode: "USD",
        inventoryQuantity: 25
      },
      {
        variantId: "team-hoodie-m",
        variantTitle: "Medium",
        price: 5999,
        currencyCode: "USD",
        inventoryQuantity: 30
      },
      {
        variantId: "team-hoodie-l",
        variantTitle: "Large",
        price: 5999,
        currencyCode: "USD",
        inventoryQuantity: 20
      }
    ],
    images: [
      {
        src: "https://placehold.co/600x400",
        alt: "Racing Team Hoodie"
      }
    ],
    status: "active",
    metadata: {
      category: "Apparel",
      weight: "0.8",
      material: "80% Cotton, 20% Polyester"
    }
  },
  {
    title: "Racing Cap",
    description: "Adjustable racing cap with embroidered logo. Perfect for sunny race days.",
    thumbnail: "https://placehold.co/600x400",
    handle: "racing-cap",
    collectionTitle: "Accessories",
    variantsList: [
      {
        variantId: "racing-cap-onesize",
        variantTitle: "One Size",
        price: 2499,
        currencyCode: "USD",
        inventoryQuantity: 100
      }
    ],
    images: [
      {
        src: "https://placehold.co/600x400",
        alt: "Racing Cap"
      }
    ],
    status: "active",
    metadata: {
      category: "Accessories",
      weight: "0.2",
      material: "100% Cotton"
    }
  }
];

async function seedProducts() {
  try {
    const productsRef = collection(db, 'products');
    
    for (const product of sampleProducts) {
      const docRef = doc(productsRef);
      const timestamp = new Date().toISOString();
      
      // Transform the data to ensure it's Firestore-compatible
      const productData = {
        title: product.title,
        description: product.description,
        thumbnail: product.thumbnail,
        handle: product.handle,
        collectionTitle: product.collectionTitle,
        variantsList: product.variantsList.map(variant => ({
          ...variant,
          price: Number(variant.price), // Ensure price is a number
          inventoryQuantity: Number(variant.inventoryQuantity) // Ensure quantity is a number
        })),
        images: product.images,
        status: product.status,
        metadata: product.metadata,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await setDoc(docRef, productData);
      console.log(`Added product: ${product.title} with ID: ${docRef.id}`);
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding products:', error);
  }
}

// Create a CLI script
async function main() {
  try {
    const args = process.argv.slice(2);
    if (args.includes('--seed-products')) {
      await seedProducts();
      console.log('Seeding process completed');
    } else {
      console.log('Please specify an action: --seed-products');
    }
  } catch (error) {
    console.error('Error in main:', error);
  } finally {
    process.exit(0);
  }
}

main().catch(console.error);