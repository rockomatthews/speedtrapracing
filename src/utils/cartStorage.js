// src/utils/cartStorage.js
const cartStorage = {
    save: (cart) => {
      try {
        // Trim cart data to minimum needed
        const trimmedCart = cart.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          variant_id: item.variant_id
        }));
        
        localStorage.setItem('shopping-cart', JSON.stringify(trimmedCart));
      } catch (error) {
        console.warn('Cart storage error:', error);
        // Try to clear space and retry
        try {
          localStorage.removeItem('userSession');
          localStorage.setItem('shopping-cart', JSON.stringify(trimmedCart));
        } catch (retryError) {
          console.error('Cart storage completely failed:', retryError);
        }
      }
    },
  
    load: () => {
      try {
        const saved = localStorage.getItem('shopping-cart');
        return saved ? JSON.parse(saved) : [];
      } catch (error) {
        console.error('Error loading cart:', error);
        return [];
      }
    }
  };
  
  export default cartStorage;