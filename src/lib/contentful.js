// src/lib/contentful.js
import { createClient } from 'contentful';

// Initialize the Contentful client
const client = createClient({
  space: '<SPACE_ID>', // Replace with your Contentful Space ID
  accessToken: '<ACCESS_TOKEN>', // Replace with your Contentful Access Token
});

// Function to fetch products from Contentful
export async function fetchContentfulProducts() {
  try {
    // Fetch entries of type 'shopifyProduct' (replace with your actual Content Type ID)
    const response = await client.getEntries({
      content_type: '<CONTENT_TYPE>', // Replace with the Content Type ID for Shopify products
    });

    // Format the products to extract relevant fields
    const formattedProducts = response.items.map((item) => ({
      id: item.sys.id,
      name: item.fields.title || 'Unnamed Product',
      price: item.fields.price || 'N/A',
      category: item.fields.category || 'Uncategorized',
      image: item.fields.image?.fields?.file?.url ? `https:${item.fields.image.fields.file.url}` : null,
    }));

    return formattedProducts;
  } catch (error) {
    console.error('Error fetching products from Contentful:', error);
    return [];
  }
}
