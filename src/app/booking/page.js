'use client';

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import bookingBackground from '../../public/homeScreenImage.jpg';

const Booking = () => {
  const router = useRouter();

  const handleNavigate = (path) => {
    router.push(path);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundImage: `url(${bookingBackground.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        gap: '20px',
      }}
    >
      {/* Heading */}
      <Typography
        variant="h3"
        sx={{ color: '#fff', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}
      >
        EASY Race Scheduling <br /> No Waiting
      </Typography>

      {/* Race Now Button */}
      <Button
        variant="contained"
        sx={{ backgroundColor: '#FFC107', color: '#000', fontSize: '20px', padding: '10px 30px' }}
        onClick={() => handleNavigate('/schedule')}
      >
        RACE NOW
      </Button>

      {/* Buy Gift Cards and Add to Cart Section */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <Button
          variant="contained"
          sx={{ backgroundColor: '#000', color: '#fff', fontSize: '16px', padding: '10px 20px' }}
        >
          Buy Gift Cards
        </Button>
        <Button
          variant="contained"
          sx={{ backgroundColor: '#FFC107', color: '#000', fontSize: '16px', padding: '10px 20px' }}
        >
          ADD TO CART
        </Button>
      </Box>

      {/* Navigation Buttons */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginTop: '30px',
          maxWidth: '600px',
          width: '100%',
        }}
      >
        <Button
          variant="contained"
          sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.6)', 
            color: '#000', 
            fontSize: '18px', 
            height: '100px', // Set height for square shape
            display: 'flex', // Center text
            justifyContent: 'center', // Center text
            alignItems: 'center' // Center text
          }}
          onClick={() => handleNavigate('/racenights')}
        >
          RACE NIGHTS
        </Button>
        <Button
          variant="contained"
          sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.6)', 
            color: '#000', 
            fontSize: '18px', 
            height: '100px', // Set height for square shape
            display: 'flex', // Center text
            justifyContent: 'center', // Center text
            alignItems: 'center' // Center text
          }}
          onClick={() => handleNavigate('/membership')}
        >
          Member Pass
        </Button>
        <Button
          variant="contained"
          sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.6)', 
            color: '#000', 
            fontSize: '18px', 
            height: '100px', // Set height for square shape
            display: 'flex', // Center text
            justifyContent: 'center', // Center text
            alignItems: 'center' // Center text
          }}
          onClick={() => handleNavigate('/marketplace')}
        >
          Apparel
        </Button>
        <Button
          variant="contained"
          sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.6)', 
            color: '#000', 
            fontSize: '18px', 
            height: '100px', // Set height for square shape
            display: 'flex', // Center text
            justifyContent: 'center', // Center text
            alignItems: 'center' // Center text
          }}
          onClick={() => handleNavigate('/franchise')}
        >
          Franchise
        </Button>
      </Box>
    </Box>
  );
};

export default Booking;
