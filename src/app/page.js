'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import comingSoon from '../public/blurBackground.jpeg';
import underConstructionIcon from '../public/underIcon.png';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Landing from './landing/page'

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
        minHeight: '100vh', // Use min-height as fallback
        padding: '5px',
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
      <Landing />
    </Box>
  );
}
