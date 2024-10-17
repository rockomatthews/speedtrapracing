'use client';

import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

const theme = createTheme();

export default function ProductList({ products, error }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Shopify Products
        </Typography>
        {error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : products.length > 0 ? (
          <Grid container spacing={4}>
            {products.map((product) => (
              <Grid item key={product.id} xs={12} sm={6} md={4}>
                <Card>
                  {product.image ? (
                    <CardMedia
                      component="img"
                      height="140"
                      image={product.image}
                      alt={product.imageAlt || product.title}
                    />
                  ) : (
                    <CardMedia
                      component="div"
                      height="140"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.200',
                        color: 'text.secondary',
                      }}
                    >
                      No image available
                    </CardMedia>
                  )}
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      {product.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Price: {product.currency} {product.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Category: {product.category}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mt: 2 }}
                    >
                      View Details
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
      </Container>
    </ThemeProvider>
  );
}