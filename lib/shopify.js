import axios from 'axios';

const shopifyFetch = async (query) => {
  const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_DOMAIN;
  const accessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  console.log('Environment variables:');
  console.log('NEXT_PUBLIC_SHOPIFY_STOREFRONT_DOMAIN:', storeDomain);
  console.log('NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN:', accessToken ? 'Set' : 'Not set');

  if (!storeDomain || !accessToken) {
    console.error('Shopify environment variables are not set correctly');
    throw new Error('Shopify configuration is missing');
  }

  try {
    const response = await axios.post(
      `https://${storeDomain}/api/2023-04/graphql.json`,
      { query },
      {
        headers: {
          'X-Shopify-Storefront-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching from Shopify:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export async function getProducts() {
  const query = `
    {
      products(first: 10) {
        edges {
          node {
            id
            title
            description
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  originalSrc
                  altText
                }
              }
            }
            productType
          }
        }
      }
    }
  `;

  try {
    const response = await shopifyFetch(query);
    return response.data.products.edges.map(({ node }) => ({
      id: node.id,
      title: node.title,
      description: node.description,
      price: node.priceRange.minVariantPrice.amount,
      currency: node.priceRange.minVariantPrice.currencyCode,
      image: node.images.edges[0]?.node.originalSrc,
      imageAlt: node.images.edges[0]?.node.altText,
      category: node.productType,
    }));
  } catch (error) {
    console.error('Error in getProducts:', error.message);
    return [];
  }
}