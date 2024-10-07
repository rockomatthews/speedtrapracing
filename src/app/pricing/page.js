import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { PricingTable } from '@mui/x-data-grid-pro';

const Pricing = () => {
  const pricingData = [
    {
      title: 'Standard',
      price: '$30',
      description: '30 minutes',
      features: ['1 Race Session', 'Up to 10 players', 'Basic track selection'],
      buttonText: 'Book Now',
      buttonVariant: 'outlined',
    },
    {
      title: 'Premium',
      price: '$50',
      description: '1 hour',
      features: ['2 Race Sessions', 'Up to 10 players', 'Advanced track selection', 'Priority booking'],
      buttonText: 'Book Now',
      buttonVariant: 'contained',
    },
    {
      title: 'Membership',
      price: '$100',
      description: 'per month',
      features: ['Unlimited Race Sessions', 'Priority booking', 'Exclusive tracks', 'Member-only events'],
      buttonText: 'Join Now',
      buttonVariant: 'contained',
    },
  ];

  const columns = [
    { field: 'title', headerName: 'Plan', width: 150 },
    { field: 'price', headerName: 'Price', width: 120 },
    { field: 'description', headerName: 'Duration', width: 150 },
    {
      field: 'features',
      headerName: 'Features',
      width: 300,
      renderCell: (params) => (
        <ul>
          {params.value.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      ),
    },
    {
      field: 'action',
      headerName: '',
      width: 150,
      renderCell: (params) => (
        <Button
          variant={params.row.buttonVariant}
          color="primary"
          size="small"
        >
          {params.row.buttonText}
        </Button>
      ),
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Pricing
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          Choose the perfect plan for your racing needs
        </Typography>

        <Box sx={{ height: 400, width: '100%', mt: 4 }}>
          <PricingTable
            rows={pricingData}
            columns={columns}
            pageSize={3}
            rowsPerPageOptions={[3]}
            disableSelectionOnClick
            disableColumnMenu
            disableColumnSelector
            disableDensitySelector
            componentsProps={{
              toolbar: {
                showQuickFilter: false,
              },
            }}
          />
        </Box>

        <Box sx={{ mt: 6 }}>
          <Typography variant="h4" component="h3" gutterBottom>
            Additional Information
          </Typography>
          <Typography variant="body1" paragraph>
            • After the first hour, each additional 30-minute session is $20.
          </Typography>
          <Typography variant="body1" paragraph>
            • Membership includes unlimited racing sessions, subject to availability.
          </Typography>
          <Typography variant="body1" paragraph>
            • Group discounts are available for parties of 5 or more. Contact us for details.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Pricing;