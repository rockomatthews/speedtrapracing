// src/app/hooks/useShoppingCart.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ShoppingCartContext = createContext();
const STORAGE_KEY = 'cart';

export function ShoppingCartProvider({ children }) {
  const [items, setItems] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setItems(parsedCart);
        }
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    try {
      // Only store essential data
      const cleanCart = items.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity
      }));

      // Check size before saving
      const cartString = JSON.stringify(cleanCart);
      if (cartString.length > 5242880) { // 5MB limit
        throw new Error('Cart data too large');
      }

      // Try to save
      try {
        localStorage.setItem(STORAGE_KEY, cartString);
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          // Clear storage and try again
          localStorage.clear();
          localStorage.setItem(STORAGE_KEY, cartString);
        } else {
          throw e;
        }
      }
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  }, [items]);

  const addToCart = (product) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);
      
      if (existingItem) {
        return currentItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      // Only store essential product data
      return [...currentItems, {
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: 1
      }];
    });
  };

  const removeFromCart = (productId) => {
    setItems(currentItems => 
      currentItems.filter(item => item.id !== productId)
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const value = {
    items,
    addToCart,
    removeFromCart,
    clearCart
  };

  return (
    <ShoppingCartContext.Provider value={value}>
      {children}
    </ShoppingCartContext.Provider>
  );
}

export function useShoppingCart() {
  const context = useContext(ShoppingCartContext);
  if (!context) {
    throw new Error('useShoppingCart must be used within a ShoppingCartProvider');
  }
  return context;
}