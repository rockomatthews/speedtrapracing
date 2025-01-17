const { adminDb } = require('./firebaseAdmin');

const addHat = async () => {
  try {
    const productsRef = adminDb.collection('products');
    const newHatRef = productsRef.doc();

    const hatData = {
      title: "Classic Baseball Hat",
      description: "Premium quality adjustable baseball hat. Perfect for any occasion.",
      price: "29.99",
      currency: "USD",
      category: "Headwear",
      inventory: "50",
      size: "Adjustable",
      images: [
        {
          src: "https://placehold.co/400x300?text=Baseball+Hat",
          alt: "Classic Baseball Hat"
        }
      ],
      thumbnail: "https://placehold.co/400x300?text=Baseball+Hat",
      handle: "classic-baseball-hat",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await newHatRef.set(hatData);
    console.log('Hat added successfully with ID:', newHatRef.id);
    return newHatRef.id;
  } catch (error) {
    console.error('Error adding hat:', error);
    throw error;
  }
};

module.exports = { addHat };