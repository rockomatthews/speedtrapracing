// src/app/payment/page.js
'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AppleIcon from '@mui/icons-material/Apple';
import PayPalIcon from '@mui/icons-material/AccountBalanceWallet'; // Simulating PayPal with wallet icon
import VenmoIcon from '@mui/icons-material/AccountBalance'; // Simulating Venmo with account balance icon
import loginBackground from '../../public/loginBackground.png'; // Background image

const Payment = () => {
  const [selectedOption, setSelectedOption] = useState('Personal'); // Handle toggle state
  const [selectedMethod, setSelectedMethod] = useState(''); // Handle payment method

  // Handle toggle for personal/group
  const handleToggle = (event, newOption) => {
    if (newOption !== null) {
      setSelectedOption(newOption);
    }
  };

  // Handle payment method click
  const handleMethodClick = (method) => {
    setSelectedMethod(method);
    console.log(`Selected Payment Method: ${method}`);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundImage: `url(${loginBackground})`,
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
        Select Payment Method
      </Typography>

      {/* Total Amount */}
      <Typography variant="h5" sx={{ color: '#fff', marginBottom: '10px' }}>
        TOTAL: $100.00
      </Typography>

      {/* Personal/Group Toggle */}
      <ToggleButtonGroup
        color="standard"
        value={selectedOption}
        exclusive
        onChange={handleToggle}
        sx={{ marginBottom: '20px' }}
      >
        <ToggleButton value="Personal" sx={{ backgroundColor: '#FFC107', fontWeight: 'bold' }}>
          Personal
        </ToggleButton>
        <ToggleButton value="Group" sx={{ backgroundColor: '#fff', fontWeight: 'bold' }}>
          Group
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Payment Method Buttons */}
      <Button
        onClick={() => handleMethodClick('Debit/Credit')}
        startIcon={<CreditCardIcon />}
        fullWidth
        sx={{
          backgroundColor: '#333',
          color: '#fff',
          fontWeight: 'bold',
          padding: '10px 20px',
          marginBottom: '15px',
          maxWidth: '350px',
          textTransform: 'none',
        }}
      >
        Debit or Credit Card
      </Button>

      <Button
        onClick={() => handleMethodClick('PayPal')}
        startIcon={<PayPalIcon />}
        fullWidth
        sx={{
          backgroundColor: '#FFC107',
          color: '#000',
          fontWeight: 'bold',
          padding: '10px 20px',
          marginBottom: '15px',
          maxWidth: '350px',
          textTransform: 'none',
        }}
      >
        PayPal
      </Button>

      <Button
        onClick={() => handleMethodClick('Venmo')}
        startIcon={<VenmoIcon />}
        fullWidth
        sx={{
          backgroundColor: '#1DA1F2',
          color: '#fff',
          fontWeight: 'bold',
          padding: '10px 20px',
          marginBottom: '15px',
          maxWidth: '350px',
          textTransform: 'none',
        }}
      >
        Venmo
      </Button>

      <Button
        onClick={() => handleMethodClick('Apple Pay')}
        startIcon={<AppleIcon />}
        fullWidth
        sx={{
          backgroundColor: '#000',
          color: '#fff',
          fontWeight: 'bold',
          padding: '10px 20px',
          marginBottom: '15px',
          maxWidth: '350px',
          textTransform: 'none',
        }}
      >
        Buy with Apple Pay
      </Button>
    </Box>
  );
};

export default Payment;