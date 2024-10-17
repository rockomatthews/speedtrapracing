import { GraphQLClient, gql } from 'graphql-request';

export default async function handler(req, res) {
  console.log('Create checkout API route hit');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { cart } = req.body;

  const shopifyDomain = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_DOMAIN;
  const shopifyToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  console.log('Shopify domain:', shopifyDomain);
  console.log('Shopify token:', shopifyToken ? 'Set' : 'Not set');

  if (!shopifyDomain || !shopifyToken) {
    console.error('Shopify configuration is missing');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const client = new GraphQLClient(`https://${shopifyDomain}/api/2023-04/graphql.json`, {
    headers: {
      'X-Shopify-Storefront-Access-Token': shopifyToken,
    },
  });

  const productsQuery = gql`
    query getProductVariants($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          variants(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    }
  `;

  const productIds = cart.map(item => item.id);
  
  try {
    const productsData = await client.request(productsQuery, { ids: productIds });
    console.log('Products data:', JSON.stringify(productsData, null, 2));

    const variantIds = productsData.nodes.map(node => node.variants.edges[0].node.id);

    const mutation = gql`
      mutation createCheckout($input: CheckoutCreateInput!) {
        checkoutCreate(input: $input) {
          checkout {
            id
            webUrl
          }
          checkoutUserErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        lineItems: cart.map((item, index) => ({
          variantId: variantIds[index],
          quantity: item.quantity,
        })),
      },
    };

    console.log('GraphQL mutation:', mutation);
    console.log('GraphQL variables:', JSON.stringify(variables, null, 2));

    console.log('Sending request to Shopify');
    const data = await client.request(mutation, variables);
    console.log('Shopify response:', JSON.stringify(data, null, 2));

    if (data.checkoutCreate.checkoutUserErrors.length > 0) {
      console.error('Checkout creation errors:', data.checkoutCreate.checkoutUserErrors);
      return res.status(400).json({ message: 'Error creating checkout', errors: data.checkoutCreate.checkoutUserErrors });
    }

    if (!data.checkoutCreate.checkout || !data.checkoutCreate.checkout.webUrl) {
      console.error('No checkout URL in response');
      return res.status(500).json({ message: 'Invalid response from Shopify' });
    }

    res.status(200).json({ checkoutUrl: data.checkoutCreate.checkout.webUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    if (error.response) {
      console.error('GraphQL response errors:', error.response.errors);
    }
    res.status(500).json({ message: 'Error creating checkout', error: error.message });
  }
}