import { fetchShopifyProducts } from '../../../lib/contentful';
import Marketplace from './page';

export default async function MarketplaceServerComponent() {
  try {
    const products = await fetchShopifyProducts();
    console.log('Fetched products:', products);  // Add this line
    return <Marketplace products={products} />;
  } catch (error) {
    console.error('Error fetching products:', error);
    return <div>Error loading products. Please try again later.</div>;
  }
}