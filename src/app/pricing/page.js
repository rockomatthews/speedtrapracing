'use client';

import React from 'react';
import { Box, Typography, Button, Container, Grid, Card, CardContent, CardActions, CardHeader } from '@mui/material';
import { useRouter } from 'next/navigation';

const Pricing = () => {
  const router = useRouter();

  const pricingData = [
    {
      title: 'Standard',
      price: '$30',
      description: '30 minutes',
      features: ['1 Race Session', 'Up to 10 players', 'Basic track selection'],
      buttonText: 'Book Now',
      buttonVariant: 'contained',
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

  const handleBookNow = () => {
    router.push('/schedule');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Pricing
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          Choose the perfect plan for your racing needs
        </Typography>

        <Grid container spacing={4} alignItems="flex-end" sx={{ mt: 4 }}>
          {pricingData.map((tier) => (
            <Grid item key={tier.title} xs={12} sm={6} md={4}>
              <Card>
                <CardHeader
                  title={tier.title}
                  titleTypographyProps={{ align: 'center' }}
                  subheaderTypographyProps={{ align: 'center' }}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'text.secondary',
                  }}
                />
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'baseline',
                      mb: 2,
                    }}
                  >
                    <Typography component="h2" variant="h3" color="text.primary">
                      {tier.price}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      /{tier.description}
                    </Typography>
                  </Box>
                  <ul>
                    {tier.features.map((line) => (
                      <Typography component="li" variant="subtitle1" align="center" key={line}>
                        {line}
                      </Typography>
                    ))}
                  </ul>
                </CardContent>
                <CardActions>
                  <Button 
                    fullWidth 
                    variant={tier.buttonVariant}
                    onClick={tier.buttonText === 'Book Now' ? handleBookNow : undefined}
                  >
                    {tier.buttonText}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

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