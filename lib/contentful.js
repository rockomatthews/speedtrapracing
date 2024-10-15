import { createClient } from 'contentful';

const client = createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID,
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN,
});

export async function fetchShopifyProducts() {
  try {
    console.log('Fetching Shopify products from Contentful...');

    // Make sure that Custom External References is enabled in Contentful.
    // Query all entries of type that contain Shopify products.
    const entries = await client.getEntries({
      content_type: 'shopifyProduct', // Adjust 'shopifyProduct' to match the content type ID used in Contentful.
      include: 2, // This defines the depth of linked entries to include.
    });

    console.log('Fetched Shopify products:', JSON.stringify(entries, null, 2));

    // Extract necessary product information.
    // Each product entry should contain details pulled from Shopify, including title, price, and images.
    const products = entries.items.map((entry) => {
      if (entry.fields.shopifyField_data) {
        const productData = entry.fields.shopifyField_data;

        return {
          id: entry.sys.id,
          name: productData.title || 'Unnamed Product', // Default value if title is not available
          price: productData.price || 0, // Assuming price is available in the data
          image: productData.image?.fields?.file?.url || null,
          category: entry.fields.category || 'General',
        };
      } else {
        console.warn(`Shopify product data is missing for entry ${entry.sys.id}`);
        return null;
      }
    }).filter(Boolean); // Filter out any entries that were null due to missing data

    return products;

  } catch (error) {
    console.error('Error fetching Shopify products:', error);
    throw error; // Rethrow to handle it in the calling component
  }
}
