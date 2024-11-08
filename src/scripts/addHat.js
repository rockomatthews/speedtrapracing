require('./config');
const medusaClient = require('../lib/medusa');

const addHat = async () => {
  try {
    const { products } = await medusaClient.products.create({
      title: "Classic Baseball Hat",
      description: "Premium quality adjustable baseball hat. Perfect for any occasion.",
      variants: [
        {
          title: "Default",
          prices: [
            {
              amount: 2999,  // in cents
              currency_code: "USD"
            }
          ],
          inventory_quantity: 50
        }
      ],
      options: [
        {
          title: "Size",
          values: ["Adjustable"]
        }
      ],
      is_giftcard: false,
      discountable: true,
      thumbnail: "https://placehold.co/400x300?text=Baseball+Hat",
      images: ["https://placehold.co/400x300?text=Baseball+Hat"],
      handle: "classic-baseball-hat",
      categories: ["Headwear"],
      collection_id: null,
      type: { value: "physical" }
    });

    console.log('Hat added successfully:', products[0].id);
    return products[0].id;
  } catch (error) {
    console.error('Error adding hat:', error);
    throw error;
  }
};

addHat().catch(console.error);