'use client'

import React, { useState } from 'react';
import { Box, Typography, Button, TextField, Grid, InputLabel, MenuItem, FormControl, Select } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateTime } from 'luxon';
import Image from 'next/image';
import loginBackground from '../../public/loginBackground.png';

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState(DateTime.now());
  const [availableSlots, setAvailableSlots] = useState([{
    time: '4:00 PM', available: 8
  }, {
    time: '4:30 PM', available: 10
  }, {
    time: '5:00 PM', available: 10
  }, {
    time: '5:30 PM', available: 10
  }, {
    time: '6:00 PM', available: 10
  }, {
    time: '6:30 PM', available: 10
  }, {
    time: '7:00 PM', available: 10
  }, {
    time: '8:30 PM', available: 10
  }, {
    time: '9:00 PM', available: 10
  }, {
    time: '10:30 PM', available: 10
  }]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [partySize, setPartySize] = useState(1);

  const handleDateChange = (newDate) => {
    if (newDate) {
      setSelectedDate(newDate);
    }
  };

  const handleCheckout = () => {
    // Handle reservation logic here
    console.log('Start Time:', startTime);
    console.log('End Time:', endTime);
    console.log('Party Size:', partySize);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}
    >
      <Image
        src={loginBackground}
        alt="Background"
        layout="fill"
        objectFit="cover"
        style={{ zIndex: -1 }}
      />

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
          zIndex: 1,
        }}
      >
        Pick a day to race
      </Typography>

      {/* Date Picker */}
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <DateTimePicker
          label="Select Date"
          value={selectedDate}
          onChange={handleDateChange}
          renderInput={(params) => (
            <TextField
              {...params}
              sx={{
                mb: 3,
                backgroundColor: '#000',
                input: { color: '#fff' },
                label: { color: '#fff' },
              }}
            />
          )}
        />
      </LocalizationProvider>

      {/* Available Slots */}
      <Box sx={{ width: '100%', maxHeight: '40vh', overflowY: 'auto', marginBottom: '20px', zIndex: 1 }}>
        <Grid container spacing={2} sx={{ padding: '10px', backgroundColor: '#000', borderRadius: '5px' }}>
          {availableSlots.map((slot, index) => (
            <Grid item xs={6} key={index}>
              <Box
                sx={{
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  padding: '10px',
                  textAlign: 'center',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#333' },
                }}
                onClick={() => setStartTime(slot.time)}
              >
                <Typography variant="h6">{slot.time}</Typography>
                <Typography variant="body2">{slot.available} open</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Selection Section */}
      <Box sx={{ width: '100%', maxWidth: '500px', backgroundColor: '#000', padding: '20px', borderRadius: '5px', zIndex: 1 }}>
        <Typography variant="h6" sx={{ color: '#fff', marginBottom: '10px' }}>Select Start and End Time</Typography>
        <FormControl fullWidth sx={{ marginBottom: '10px' }}>
          <InputLabel sx={{ color: '#fff' }}>Start Time</InputLabel>
          <Select
            value={startTime}
            label="Start Time"
            onChange={(e) => setStartTime(e.target.value)}
            sx={{ color: '#fff' }}
          >
            {availableSlots.map((slot, index) => (
              <MenuItem key={index} value={slot.time}>{slot.time}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ marginBottom: '10px' }}>
          <InputLabel sx={{ color: '#fff' }}>End Time</InputLabel>
          <Select
            value={endTime}
            label="End Time"
            onChange={(e) => setEndTime(e.target.value)}
            sx={{ color: '#fff' }}
          >
            {availableSlots.map((slot, index) => (
              <MenuItem key={index} value={slot.time}>{slot.time}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ marginBottom: '20px' }}>
          <InputLabel sx={{ color: '#fff' }}>Party Size</InputLabel>
          <Select
            value={partySize}
            label="Party Size"
            onChange={(e) => setPartySize(e.target.value)}
            sx={{ color: '#fff' }}
          >
            {[...Array(10).keys()].map((size) => (
              <MenuItem key={size + 1} value={size + 1}>{size + 1} Sim{size > 0 ? 's' : ''}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          fullWidth
          sx={{ backgroundColor: '#FFC107', color: '#000' }}
          onClick={handleCheckout}
        >
          Checkout
        </Button>
      </Box>
    </Box>
  );
};

export default Schedule;