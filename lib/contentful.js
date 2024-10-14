import { createClient } from 'contentful';

const client = createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID,
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN,
});

export async function fetchShopifyProducts() {
  try {
    console.log('Fetching content types from Contentful...');
    const contentTypes = await client.getContentTypes();
    console.log('Available content types:', contentTypes.items.map(type => type.name));

    console.log('Fetching Shopify products from Contentful...');
    const entries = await client.getEntries({
      content_type: 'product', // Changed from 'shopifyProduct' to 'product'
      include: 2,
    });

    console.log('Contentful response:', JSON.stringify(entries, null, 2));

    if (!entries.items || entries.items.length === 0) {
      console.log('No products found in Contentful');
      return [];
    }

    const products = entries.items.map((item) => {
      console.log('Processing item:', JSON.stringify(item, null, 2));
      return {
        id: item.sys.id,
        name: item.fields.title || 'Unnamed Product',
        price: item.fields.variants?.[0]?.price || 0,
        image: item.fields.image?.[0]?.fields?.file?.url || '',
        category: item.fields.productType || 'Other',
      };
    });

    console.log('Mapped products:', products);

    return products;
  } catch (error) {
    console.error('Error fetching Shopify products:', error);
    throw error;
  }
}