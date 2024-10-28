'use client';

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import comingSoon from '../public/comingsoon.png';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        backgroundImage: `url(${comingSoon.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4rem 2rem',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1,
        },
      }}
    >
      <Typography
        variant="h2"
        component="h1"
        sx={{
          color: 'white',
          textAlign: 'center',
          fontWeight: 'bold',
          zIndex: 2,
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        Main Site Under Construction
      </Typography>
      
      <Button
        variant="contained"
        size="large"
        onClick={() => router.push('/marketplace')}
        sx={{
          backgroundColor: '#ffcc03',
          color: '#000',
          padding: '1rem 2rem',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          zIndex: 2,
          '&:hover': {
            backgroundColor: '#e6b800',
          },
        }}
      >
        View our Apparel!
      </Button>
    </Box>
  );
}