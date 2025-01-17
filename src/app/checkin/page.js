// src/app/checkin/page.js
'use client';

import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import loginBackground from '../../public/loginBackground.png'; // Background image

const CheckIn = () => {
  // Placeholder data for bookings
  const [bookings, setBookings] = useState([
    { id: 1, name: 'John Fishburne', partySize: 6, time: '6:00-6:30', checkedIn: false, tooEarly: false },
    { id: 2, name: 'John Fishburne', partySize: 2, time: '8:00-8:30', checkedIn: false, tooEarly: true },
  ]);

  const handleCheckIn = (id) => {
    setBookings(
      bookings.map((booking) =>
        booking.id === id ? { ...booking, checkedIn: !booking.checkedIn } : booking
      )
    );
  };

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundImage: `url(${loginBackground.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}
    >
      {/* Heading */}
      <Typography
        variant="h4"
        sx={{
          color: '#fff',
          fontWeight: 'bold',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '10px 20px',
          borderRadius: '5px',
          marginBottom: '20px',
        }}
      >
        Select Event to Check-In
      </Typography>

      {/* List of bookings */}
      {bookings.map((booking) => (
        <Box
          key={booking.id}
          onClick={() => handleCheckIn(booking.id)}
          sx={{
            width: '350px',
            padding: '20px',
            marginBottom: '20px',
            backgroundColor: booking.checkedIn ? '#ff0000' : '#ccc',
            color: booking.checkedIn ? '#fff' : '#000',
            borderRadius: '10px',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          {/* Reservation Name */}
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: booking.checkedIn ? '#fff' : '#000' }}>
            Reservation Name
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold', marginBottom: '5px' }}>
            {booking.name} ({booking.partySize})
          </Typography>

          {/* Reservation Time */}
          <Typography variant="h6" sx={{ marginBottom: '5px' }}>
            {booking.time}
          </Typography>

          {/* Too Early Label */}
          {booking.tooEarly && !booking.checkedIn && (
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                color: '#fff',
                fontStyle: 'italic',
              }}
            >
              Too Early
            </Typography>
          )}

          {/* Check Mark */}
          {booking.checkedIn && (
            <Typography
              sx={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '30px',
                color: '#fff',
              }}
            >
              ✓
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CheckIn;
