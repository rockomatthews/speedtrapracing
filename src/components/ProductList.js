'use client';

import React, { useState } from 'react';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { useTheme } from '@mui/material/styles';
import ShoppingCart from './ShoppingCart';

export default function ProductList({ products, error }) {
  const [cart, setCart] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const theme = useTheme();

  const addToCart = (product) => {
    console.log('Adding to cart:', product);
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleGoToCheckout = () => {
    setSnackbarOpen(false);
    if (window.goToCheckout) {
      window.goToCheckout();
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseDialog = () => {
    setSelectedProduct(null);
    setZoomedImage(null);
  };

  const handleImageClick = (imageSrc) => {
    setZoomedImage(imageSrc);
  };

  const handleCloseZoom = () => {
    setZoomedImage(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h2" component="h1" gutterBottom align="center">
        Storefront
      </Typography>
      <ShoppingCart cart={cart} setCart={setCart} />
      {error ? (
        <Typography color="error" align="center">
          {error}
        </Typography>
      ) : products.length > 0 ? (
        <Grid container spacing={4}>
          {products.map((product) => (
            <Grid item key={product.id} xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
                onClick={() => handleProductClick(product)}
              >
                {product.images && product.images[0] ? (
                  <CardMedia
                    component="img"
                    sx={{
                      aspectRatio: '4/3',
                      objectFit: 'cover',
                    }}
                    image={product.images[0].src}
                    alt={product.images[0].alt || product.title}
                  />
                ) : (
                  <CardMedia
                    component="div"
                    sx={{
                      aspectRatio: '4/3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.paper',
                      color: 'text.secondary',
                    }}
                  >
                    No image available
                  </CardMedia>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, mr: 1 }}>
                      {product.title}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ whiteSpace: 'nowrap' }}>
                      {product.currency} {parseFloat(product.price).toFixed(2)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Category: {product.category}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="h5" align="center" sx={{ mt: 4 }}>
          No products available. Please check back later.
        </Typography>
      )}

      <Dialog
        open={Boolean(selectedProduct)}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        {selectedProduct && (
          <>
            <DialogTitle sx={{ 
              m: 0, 
              p: 2, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" component="div">
                {selectedProduct.title}
              </Typography>
              <IconButton
                aria-label="close"
                onClick={handleCloseDialog}
                sx={{
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <HighlightOffIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {selectedProduct.images.slice(0, 4).map((image, index) => (
                  <Grid item xs={6} key={index}>
                    <Box
                      component="img"
                      sx={{
                        width: '100%',
                        aspectRatio: '1',
                        objectFit: 'cover',
                        cursor: 'zoom-in',
                        borderRadius: 1,
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.02)',
                        },
                      }}
                      src={image.src}
                      alt={image.alt || selectedProduct.title}
                      onClick={() => handleImageClick(image.src)}
                    />
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedProduct.currency} {parseFloat(selectedProduct.price).toFixed(2)}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Category: {selectedProduct.category}
                </Typography>
                <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
                  {selectedProduct.description}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  addToCart(selectedProduct);
                  handleCloseDialog();
                }}
              >
                Add to Cart
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={Boolean(zoomedImage)}
        onClose={handleCloseZoom}
        maxWidth="xl"
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            overflow: 'hidden'
          }
        }}
      >
        <IconButton
          aria-label="close"
          onClick={handleCloseZoom}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
        >
          <HighlightOffIcon />
        </IconButton>
        <Box
          component="img"
          sx={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            objectFit: 'contain',
          }}
          src={zoomedImage}
          alt="Zoomed product image"
        />
      </Dialog>

      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <SnackbarContent
          message="Item added to cart"
          action={
            <React.Fragment>
              <Button color="secondary" size="small" onClick={handleGoToCheckout}>
                Go to Checkout
              </Button>
              <Button color="secondary" size="small" onClick={handleCloseSnackbar}>
                Keep Shopping
              </Button>
            </React.Fragment>
          }
        />
      </Snackbar>
    </Container>
  );
}