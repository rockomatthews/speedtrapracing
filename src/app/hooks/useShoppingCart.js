'use client';

import { useState, useEffect } from 'react';

export function useShoppingCart() {
  const [cart, setCart] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize cart from sessionStorage
  useEffect(() => {
    try {
      const savedCart = window.sessionStorage.getItem('shopping-cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading cart from sessionStorage:', error);
      setIsInitialized(true);
    }
  }, []);

  // Update sessionStorage when cart changes
  useEffect(() => {
    if (isInitialized) {
      try {
        window.sessionStorage.setItem('shopping-cart', JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart to sessionStorage:', error);
      }
    }
  }, [cart, isInitialized]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
}