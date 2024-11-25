// app/booking/cancel/page.js
'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Card,
  CardContent
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useRouter } from 'next/navigation';

const CancelPage = () => {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `url('/loginBackground.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: { xs: 'scroll', md: 'fixed' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: { xs: '16px', md: '40px' },
      }}
    >
      <Card
        sx={{
          maxWidth: 600,
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: { xs: '24px', md: '48px' },
          }}
        >
          <ErrorOutlineIcon
            sx={{
              fontSize: { xs: 60, md: 80 },
              color: '#f44336',
              marginBottom: 2,
            }}
          />
          
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              marginBottom: 3,
              textAlign: 'center',
              fontSize: { xs: '1.5rem', md: '2rem' },
            }}
          >
            Payment Cancelled
          </Typography>

          <Typography
            variant="body1"
            sx={{
              marginBottom: 4,
              textAlign: 'center',
              color: '#666',
            }}
          >
            Your payment was cancelled and you have not been charged.
            Would you like to try again or return to the booking page?
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <Button
              variant="outlined"
              onClick={() => router.push('/schedule')}
              sx={{
                borderColor: '#000',
                color: '#000',
                padding: '12px 32px',
                '&:hover': {
                  borderColor: '#333',
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Return to Booking
            </Button>
            
            <Button
              variant="contained"
              onClick={() => router.back()}
              sx={{
                backgroundColor: '#000',
                color: '#fff',
                padding: '12px 32px',
                '&:hover': {
                  backgroundColor: '#333',
                },
              }}
            >
              Try Again
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CancelPage;