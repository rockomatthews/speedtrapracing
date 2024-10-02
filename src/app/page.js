// src/app/page.js
'use client';  // Mark this as a Client Component

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import bg from '../public/homescreen.webp';

const Home = () => {
  const router = useRouter();  // Using useRouter from next/navigation

  const handleBooking = () => {
    router.push('/booking');  // Navigating to /booking page
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        backgroundImage: `url(${bg.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        color: '#fff',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          EASY Race Scheduling
        </Typography>
        <Typography variant="h4" gutterBottom>
          No Waiting
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{
            marginTop: 2,
            backgroundColor: '#FFC107',
            color: '#000',
            '&:hover': {
              backgroundColor: '#FFA000',
            },
          }}
          onClick={handleBooking}
        >
          Race Now
        </Button>
      </Box>
    </Box>
  );
};

export default Home;