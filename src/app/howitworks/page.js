// src/app/howitworks/page.js
'use client';

import React from 'react';
import { Box, Typography, Grid, Button, Card, CardContent } from '@mui/material';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SportsMotorsportsIcon from '@mui/icons-material/SportsMotorsports';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

const steps = [
  {
    icon: <EventAvailableIcon sx={{ fontSize: '60px', color: '#FFC107' }} />,
    title: '1. Book Your Race',
    description: 'Easily book your race slot online, pick the time that suits you, and get ready to experience the thrill.',
  },
  {
    icon: <CheckCircleOutlineIcon sx={{ fontSize: '60px', color: '#FFC107' }} />,
    title: '2. Arrive & Check-In',
    description: 'When you arrive, check in with the front desk, grab your ticket, and get ready to race!',
  },
  {
    icon: <SportsMotorsportsIcon sx={{ fontSize: '60px', color: '#FFC107' }} />,
    title: '3. Get Ready',
    description: 'Put on your racing gear, take your seat in the immersive racing rig, and get ready for an adrenaline rush.',
  },
  {
    icon: <SportsMotorsportsIcon sx={{ fontSize: '60px', color: '#FFC107' }} />,
    title: '4. Race in a Full Motion Rig',
    description:
      'Experience the immersive thrill of iRacing in a full-motion rig, complete with force feedback, VR, and surround sound.',
  },
  {
    icon: <LeaderboardIcon sx={{ fontSize: '60px', color: '#FFC107' }} />,
    title: '5. Check Leaderboards & Results',
    description: 'See where you stand on the leaderboard and challenge your friends for the top spot!',
  },
];

const HowItWorks = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#000',
        padding: '40px',
        textAlign: 'center',
        color: '#fff',
      }}
    >
      {/* Header */}
      <Typography variant="h2" sx={{ fontWeight: 'bold', color: '#FFC107', marginBottom: '40px' }}>
        How It Works
      </Typography>

      {/* Steps Grid */}
      <Grid container spacing={4}>
        {steps.map((step, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                backgroundColor: '#1a1a1a',
                borderRadius: '15px',
                color: '#fff',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              {step.icon}
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
                  {step.title}
                </Typography>
                <Typography variant="body1">{step.description}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Call to Action */}
      <Box sx={{ marginTop: '50px' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', marginBottom: '20px' }}>
          Ready to Race?
        </Typography>
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#FFC107',
            color: '#000',
            padding: '15px 40px',
            fontWeight: 'bold',
            fontSize: '18px',
            '&:hover': { backgroundColor: '#FFA000' },
          }}
        >
          Book Your Race Now
        </Button>
      </Box>
    </Box>
  );
};

export default HowItWorks;
