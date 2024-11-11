// src/app/admin/products/page.js
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import medusaClient from '@/lib/medusa-client';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Headwear',
    size: 'Adjustable',
    inventory: '50',
    imageUrl: ''
  });

  const categories = ['Headwear', 'Accessories', 'Apparel'];
  const sizes = ['Adjustable', 'One Size', 'S', 'M', 'L', 'XL'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { products } = await medusaClient.products.list({});
      setProducts(products);
    } catch (err) {
      setError(err.message);
      showSnackbar('Error loading products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setFormData({
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
        size: product.size,
        inventory: product.inventory,
        imageUrl: product.images[0]?.src || ''
      });
      setEditingProduct(product);
    } else {
      setFormData({
        title: '',
        description: '',
        price: '',
        category: 'Headwear',
        size: 'Adjustable',
        inventory: '50',
        imageUrl: ''
      });
      setEditingProduct(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await medusaClient.admin.products.update(editingProduct.id, {
          ...formData,
          price: parseFloat(formData.price),
          inventory: parseInt(formData.inventory),
          images: [{ src: formData.imageUrl, alt: formData.title }]
        });
        showSnackbar('Product updated successfully');
      } else {
        await medusaClient.products.create({
          ...formData,
          price: parseFloat(formData.price),
          inventory: parseInt(formData.inventory),
          images: [formData.imageUrl]
        });
        showSnackbar('Product created successfully');
      }
      handleCloseDialog();
      fetchProducts();
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await medusaClient.admin.products.delete(productId);
        showSnackbar('Product deleted successfully');
        fetchProducts();
      } catch (err) {
        showSnackbar(err.message, 'error');
      }
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Products
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Product
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={product.images[0]?.src || 'https://placehold.co/400x300?text=No+Image'}
                alt={product.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="h6" component="h2" gutterBottom>
                    {product.title}
                  </Typography>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenDialog(product)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(product.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {product.description}
                </Typography>
                <Typography variant="h6" color="primary">
                  ${parseFloat(product.price).toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  Category: {product.category}
                </Typography>
                <Typography variant="body2">
                  Size: {product.size}
                </Typography>
                <Typography variant="body2">
                  In Stock: {product.inventory}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Title"
                  fullWidth
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Price"
                  fullWidth
                  required
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Inventory"
                  fullWidth
                  required
                  type="number"
                  value={formData.inventory}
                  onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Category"
                  fullWidth
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Size"
                  fullWidth
                  required
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                >
                  {sizes.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Image URL"
                  fullWidth
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  helperText="Enter the URL of the product image"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}