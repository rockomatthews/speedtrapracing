import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  Button,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export default function ShoppingCart({ cart, setCart }) {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (isOpen) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setOpen(isOpen);
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  const handleCheckout = async () => {
    console.log('Checkout button clicked');
    console.log('Cart contents:', cart);
    try {
      console.log('Sending request to /api/create-checkout');
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Checkout creation failed');
      }

      if (data.checkoutUrl) {
        console.log('Redirecting to:', data.checkoutUrl);
        window.location.href = data.checkoutUrl;
      } else {
        console.error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  // Expose the checkout function globally
  React.useEffect(() => {
    window.goToCheckout = handleCheckout;
  }, [cart]);

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<ShoppingCartIcon />}
        onClick={toggleDrawer(true)}
        sx={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}
      >
        Cart ({totalItems})
      </Button>
      <Drawer anchor="right" open={open} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 300, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Shopping Cart
          </Typography>
          <List>
            {cart.map((item) => (
              <ListItem
                key={item.id}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => removeFromCart(item.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={item.title}
                  secondary={`${item.currency} ${item.price} x ${item.quantity}`}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <Button size="small" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>-</Button>
                  <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                  <Button size="small" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                </Box>
              </ListItem>
            ))}
          </List>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Total: {cart[0]?.currency} {totalPrice.toFixed(2)}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            Checkout
          </Button>
        </Box>
      </Drawer>
    </>
  );
}