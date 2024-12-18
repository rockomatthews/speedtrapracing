// app/booking/success/page.js
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useRouter, useSearchParams } from 'next/navigation';

const SuccessPage = () => {
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadBookingDetails = () => {
      const details = localStorage.getItem('bookingDetails');
      if (details) {
        setBookingDetails(JSON.parse(details));
      }
      setLoading(false);
    };

    loadBookingDetails();
    // Clear the booking details from localStorage after successful payment
    localStorage.removeItem('bookingDetails');
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000000',
        }}
      >
        <CircularProgress sx={{ color: '#fff' }} />
      </Box>
    );
  }

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
          <CheckCircleOutlineIcon
            sx={{
              fontSize: { xs: 60, md: 80 },
              color: '#4CAF50',
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
            Payment Successful!
          </Typography>

          {bookingDetails && (
            <Box sx={{ width: '100%', marginBottom: 3 }}>
              <Typography variant="h6" sx={{ marginBottom: 2 }}>
                Booking Details:
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: 1 }}>
                Date: {new Date(bookingDetails.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: 1 }}>
                Time: {bookingDetails.timeSlots.join(', ')}
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: 1 }}>
                Group Size: {bookingDetails.groupSize} {bookingDetails.groupSize === 1 ? 'person' : 'people'}
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: 1 }}>
                Total Paid: ${bookingDetails.totalPrice.toFixed(2)}
              </Typography>
            </Box>
          )}

          <Typography
            variant="body1"
            sx={{
              marginBottom: 4,
              textAlign: 'center',
              color: '#666',
            }}
          >
            A confirmation email will be sent to you shortly with your booking details.
          </Typography>

          <Button
            variant="contained"
            onClick={() => router.push('/')}
            sx={{
              backgroundColor: '#000',
              color: '#fff',
              padding: '12px 32px',
              '&:hover': {
                backgroundColor: '#333',
              },
            }}
          >
            Return Home
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SuccessPage;