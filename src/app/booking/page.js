'use client';

import React from 'react';
import { Box, Button, Typography, useMediaQuery } from '@mui/material';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import bookingBackground from '../../public/homeScreenImage.jpg';
import { customFont } from '.././fonts.js';
import HowItWorks from '../howitworks/page';

const Booking = () => {
  const router = useRouter();
  const isDesktop = useMediaQuery('(min-width:960px)');

  const handleNavigate = (path) => {
    router.push(path);
  };

  return (
    <Box>
      <Box
        sx={{
          minHeight: '100vh',
          backgroundImage: `url(${bookingBackground.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          gap: '20px',
          position: 'relative',
        }}
      >
        {/* Gift Cards Strip - Desktop */}
        {isDesktop && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              width: '100%',
              padding: '10px 20px',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '20px',
                maxWidth: '600px',
                width: '100%',
              }}
            >
              <Typography variant="h6" sx={{ color: '#fff' }}>
                Buy Gift Cards
              </Typography>
              <Button
                variant="contained"
                sx={{ backgroundColor: '#FFC107', color: '#000', fontSize: '16px', padding: '5px 15px' }}
              >
                Add to Cart
              </Button>
            </Box>
          </Box>
        )}

        {/* Heading */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h3"
            sx={{ 
              color: '#fff', 
              fontWeight: 'bold', 
              fontFamily: customFont.style.fontFamily,
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              marginBottom: '10px',
            }}
          >
            EASY Race Scheduling
          </Typography>
          <Typography
            variant="h3"
            sx={{ 
              color: '#fff', 
              fontWeight: 'bold', 
              fontFamily: customFont.style.fontFamily,
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            No Waiting
          </Typography>
        </Box>

        {/* Race Now Button */}
        <Button
          variant="contained"
          sx={{ backgroundColor: '#FFC107', color: '#000', fontSize: '20px', padding: '10px 30px' }}
          onClick={() => handleNavigate('/book')}
        >
          RACE NOW
        </Button>

        {/* Buy Gift Cards Strip - Mobile */}
        {!isDesktop && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              width: '100vw',
              padding: '10px 20px',
              marginTop: '20px',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '20px',
                maxWidth: '600px',
                width: '100%',
              }}
            >
              <Typography variant="h6" sx={{ color: '#fff' }}>
                Buy Gift Cards
              </Typography>
              <Button
                variant="contained"
                sx={{ backgroundColor: '#FFC107', color: '#000', fontSize: '16px', padding: '5px 15px' }}
              >
                Add to Cart
              </Button>
            </Box>
          </Box>
        )}

        {/* Navigation Buttons */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginTop: '30px',
            padding: '20px',
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
              height: '200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
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
              height: '200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
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
              height: '200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
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
              height: '200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onClick={() => handleNavigate('/franchise')}
          >
            Franchise
          </Button>
        </Box>
      </Box>

      {/* How It Works Section */}
      <HowItWorks />
    </Box>
  );
};

export default Booking;