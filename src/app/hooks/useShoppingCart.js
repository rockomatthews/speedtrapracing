// src/app/hooks/useShoppingCart.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ShoppingCartContext = createContext();

export function ShoppingCartProvider({ children }) {
  const [items, setItems] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
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
      
      return [...currentItems, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setItems(currentItems => 
      currentItems.filter(item => item.id !== productId)
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const updateQuantity = (productId, quantity) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === productId
          ? { ...item, quantity: parseInt(quantity) }
          : item
      )
    );
  };

  return (
    <ShoppingCartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      clearCart,
      updateQuantity
    }}>
      {children}
    </ShoppingCartContext.Provider>
  );
}

export function useShoppingCart() {
  return useContext(ShoppingCartContext);
}