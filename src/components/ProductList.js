// src/components/ProductList.js
import React from 'react';
import { 
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button
} from '@mui/material';

export default function ProductList({ products, error, onAddToCart }) {
  if (error) {
    return (
      <Typography color="error" align="center">
        {error}
      </Typography>
    );
  }

  const formatPrice = (price, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h2" component="h1" gutterBottom align="center">
        Storefront
      </Typography>
      
      {products.length > 0 ? (
        <Grid container spacing={4}>
          {products.map((product) => {
            const price = product.variants?.[0]?.prices?.[0]?.amount || 0;
            const displayPrice = price / 100; // Convert from cents to dollars
            const currency = product.variants?.[0]?.prices?.[0]?.currency_code || 'USD';

            return (
              <Grid item key={product.id} xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                    <Box sx={{ aspectRatio: '4/3', bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      No image available
                    </Box>
                  )}
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {product.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {product.category}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      {formatPrice(displayPrice, currency)}
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth
                      onClick={() => onAddToCart({
                        ...product,
                        displayPrice,
                        currency
                      })}
                    >
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Typography variant="h5" align="center" sx={{ mt: 4 }}>
          No products available
        </Typography>
      )}
    </Container>
  );
}