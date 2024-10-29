'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      cart: [],
      addToCart: (product) =>
        set((state) => {
          const existingItem = state.cart.find((item) => item.id === product.id);
          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return { cart: [...state.cart, { ...product, quantity: 1 }] };
        }),
      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== productId),
        })),
      updateQuantity: (productId, newQuantity) =>
        set((state) => {
          if (newQuantity < 1) {
            return {
              cart: state.cart.filter((item) => item.id !== productId),
            };
          }
          return {
            cart: state.cart.map((item) =>
              item.id === productId ? { ...item, quantity: newQuantity } : item
            ),
          };
        }),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'shopping-cart',
      storage: {
        getItem: (name) => {
          try {
            const str = sessionStorage.getItem(name);
            if (!str) return null;
            return JSON.parse(str);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            sessionStorage.setItem(name, JSON.stringify(value));
          } catch {
            // Handle storage errors silently
          }
        },
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    }
  )
);

export function useShoppingCart() {
  return {
    cart: useStore((state) => state.cart),
    addToCart: useStore((state) => state.addToCart),
    removeFromCart: useStore((state) => state.removeFromCart),
    updateQuantity: useStore((state) => state.updateQuantity),
    clearCart: useStore((state) => state.clearCart),
  };
}