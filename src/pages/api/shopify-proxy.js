import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const response = await axios.post(
        `https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/2023-04/graphql.json`,
        req.body,
        {
          headers: {
            'X-Shopify-Storefront-Access-Token': process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
            'Content-Type': 'application/json',
          },
        }
      );
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}