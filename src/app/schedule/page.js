'use client'

import React, { useState } from 'react';
import { Box, Typography, Button, Grid, InputLabel, MenuItem, FormControl, Select } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import Image from 'next/image';
import loginBackground from '../../public/loginBackground.png';

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState({});
  const [groupSize, setGroupSize] = useState(1);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleTimeSlotClick = (time) => {
    setSelectedTimeSlots(prevSelectedTimeSlots => {
      const newSlots = { ...prevSelectedTimeSlots };
      if (time in newSlots) {
        delete newSlots[time];
      } else {
        newSlots[time] = groupSize;
      }
      return newSlots;
    });
  };

  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', 
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', 
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', 
    '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'
  ];

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        padding: '20px',
        width: '100%',
      }}
    >
      <Image
        src={loginBackground}
        alt="Background"
        layout="fill"
        objectFit="cover"
        style={{ zIndex: -1 }}
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '100%',
          maxWidth: '500px',
          padding: '30px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '10px',
          zIndex: 1,
        }}
      >
        <Typography variant="h4" sx={{ color: '#fff', textAlign: 'center', marginBottom: '20px' }}>
          Schedule Your Race
        </Typography>

        <LocalizationProvider dateAdapter={AdapterLuxon}>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={handleDateChange}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </LocalizationProvider>

        <FormControl fullWidth>
          <InputLabel>Group Size</InputLabel>
          <Select
            value={groupSize}
            onChange={(e) => setGroupSize(e.target.value)}
            required
          >
            {[...Array(10)].map((_, i) => (
              <MenuItem key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Person' : 'People'}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="h6" sx={{ color: '#fff', marginTop: '20px' }}>
          Select Time Slot(s)
        </Typography>
        <Grid container spacing={2}>
          {timeSlots.map((time) => {
            const isSelected = time in selectedTimeSlots;
            const availableSims = isSelected ? 10 - selectedTimeSlots[time] : 10;
            return (
              <Grid item xs={6} sm={4} md={3} key={time}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleTimeSlotClick(time)}
                  disabled={!isSelected && availableSims < groupSize}
                  sx={{
                    backgroundColor: isSelected ? '#ffcc03' : '#333',
                    color: isSelected ? '#000' : '#fff',
                    '&:hover': {
                      backgroundColor: isSelected ? '#e6b800' : '#444',
                    },
                    height: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '8px',
                  }}
                >
                  <Typography variant="body2">{time}</Typography>
                  <Typography variant="caption">
                    {availableSims} sims open
                  </Typography>
                </Button>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
};

export default Schedule;