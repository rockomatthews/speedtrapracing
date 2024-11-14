// src/components/ProductList.js
'use client';

import React from 'react';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function ProductList({ products, error }) {
  if (error) {
    return (
      <Typography color="error" align="center">
        {error}
      </Typography>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h2" component="h1" gutterBottom align="center">
        Storefront
      </Typography>
      
      {products.length > 0 ? (
        <Grid container spacing={4}>
          {products.map((product) => (
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
                  <Typography variant="subtitle1">
                    {product.currency} {parseFloat(product.price).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="h5" align="center" sx={{ mt: 4 }}>
          No products available
        </Typography>
      )}
    </Container>
  );
}