'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import comingSoon from '../public/blurBackground.jpeg';
import underConstructionIcon from '../public/underIcon.png';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Target date: March 19, 2025
    const targetDate = new Date('March 19, 2025 00:00:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const timeLeft = targetDate - now;

      if (timeLeft > 0) {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        setTimeRemaining({ days, hours, minutes, seconds });
      } else {
        // If the date has passed, stop the countdown
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Update countdown every second
    const intervalId = setInterval(updateCountdown, 1000);

    // Initial update
    updateCountdown();

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

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
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignContent: 'center',
        alignItems: 'center'
      }}>
        <Typography
          variant="h2"
          component="h1"
          sx={{
            color: 'white',
            textAlign: 'center',
            fontWeight: 'bold',
            zIndex: 2,
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            marginTop: '25px'
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
            margin: '35px',
            zIndex: 2,
            '&:hover': {
              backgroundColor: '#e6b800',
            },
          }}
        >
          View Our Apparel!
        </Button>

        {/* Countdown Timer */}
        <Typography
          variant="h4"
          component="p"
          sx={{
            color: '#fff',
            zIndex: 2,
            fontSize: '20px',
            textAlign: 'center',
            fontWeight: 'bold',
            marginTop: '10px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          RACE START IN
        </Typography>
        <Typography
          variant="h4"
          component="p"
          sx={{
            color: '#fff',
            zIndex: 2,
            textAlign: 'center',
            fontWeight: 'bold',
            marginTop: '10px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
        </Typography>
      </Box>

      <Box sx={{ margin: "auto" }}>
        <Image src={underConstructionIcon} alt="under construction icon" width={350} height={350} />
      </Box>
    </Box>
  );
}
