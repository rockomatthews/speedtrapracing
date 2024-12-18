// src/context/CartContext.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

// Cart storage utility functions
const cartStorage = {
    save: (cart) => {
        try {
            const trimmedCart = cart.map(item => ({
                id: item.id,
                title: item.title?.substring(0, 100) || '',
                price: Number(item.price) || 0,
                currency: item.currency || 'USD',
                quantity: Number(item.quantity) || 1,
                variant_id: item.variant_id,
                raw_price: item.raw_price ? {
                    amount: item.raw_price.amount,
                    currency_code: item.raw_price.currency_code
                } : null
            }));

            try {
                localStorage.setItem('shopping-cart', JSON.stringify(trimmedCart));
            } catch (storageError) {
                localStorage.clear();
                localStorage.setItem('shopping-cart', JSON.stringify(trimmedCart));
            }
        } catch (error) {
            console.error('Failed to save cart:', error);
        }
    },

    load: () => {
        try {
            const saved = localStorage.getItem('shopping-cart');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load cart:', error);
            return [];
        }
    }
};

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load cart on initial render
    useEffect(() => {
        const savedCart = cartStorage.load();
        if (savedCart.length > 0) {
            setCartItems(savedCart);
        }
    }, []);

    // Save cart when it changes
    useEffect(() => {
        if (cartItems.length > 0) {
            cartStorage.save(cartItems);
        }
    }, [cartItems]);

    const addToCart = (product) => {
        if (!product?.id) return;

        const cartProduct = {
            id: product.id,
            title: product.title,
            price: product.displayPrice,
            currency: product.currency || 'USD',
            quantity: 1,
            variant_id: product.variants?.[0]?.id,
            raw_price: product.variants?.[0]?.prices?.[0]
        };

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            
            if (existingItem) {
                return prevItems.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: (item.quantity || 0) + 1 }
                        : item
                );
            }
            
            return [...prevItems, cartProduct];
        });
    };

    const updateCartItemQuantity = (productId, newQuantity) => {
        if (!productId || newQuantity < 1) return;

        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === productId
                    ? { ...item, quantity: Number(newQuantity) }
                    : item
            )
        );
    };

    const removeCartItem = (productId) => {
        if (!productId) return;
        setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('shopping-cart');
    };

    const value = {
        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateCartItemQuantity,
        removeCartItem,
        clearCart
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};