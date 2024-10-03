// src/app/schedule/page.js
'use client';

import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import loginBackground from '../../public/loginBackground.png'; // Background image
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Import react-datepicker styles
import './schedule.css'; // Import your custom styles

const Schedule = () => {
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());

  const handleDateTimeChange = (newDate) => {
    if (newDate) {
      setSelectedDateTime(newDate);  // Ensure that newDate is valid and set it
    }
  };

  const handleSubmit = () => {
    // You can handle form submission or navigation here
    console.log('Selected Date and Time:', selectedDateTime);
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
        Pick a day to race
      </Typography>

      {/* Inline DateTime Picker (no input) */}
      <DatePicker
        selected={selectedDateTime}
        onChange={handleDateTimeChange}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={30}
        inline
        dateFormat="MMMM d, yyyy h:mm aa"
        calendarClassName="custom-calendar" // Apply custom styles to the calendar
      />

      {/* Submit Button */}
      <Button
        variant="contained"
        sx={{ backgroundColor: '#FFC107', color: '#000', padding: '10px 30px', marginTop: '20px' }}
        onClick={handleSubmit}
      >
        Confirm
      </Button>
    </Box>
  );
};

export default Schedule;
