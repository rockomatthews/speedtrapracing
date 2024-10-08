'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography, Button, Grid, FormControl, Select, MenuItem, Paper, Slide, useMediaQuery } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import Image from 'next/image';
import loginBackground from '../../public/loginBackground.png';

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState({});
  const [groupSize, setGroupSize] = useState(1);
  const [showTempBar, setShowTempBar] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 9; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  }, []);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlots({});
  };

  const handleTimeSlotToggle = (time) => {
    setSelectedTimeSlots(prev => {
      const newSlots = { ...prev };
      if (newSlots[time]) {
        delete newSlots[time];
      } else {
        newSlots[time] = true;
      }
      return newSlots;
    });
  };

  const calculateTotalPrice = () => {
    const slotCount = Object.keys(selectedTimeSlots).length;
    if (slotCount === 0) return 0;
    return (30 + (slotCount - 1) * 20) * groupSize;
  };

  useEffect(() => {
    setShowTempBar(Object.keys(selectedTimeSlots).length === 1);
  }, [selectedTimeSlots]);

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
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '100vh',
        paddingBottom: '80px',
        backgroundColor: isMobile ? 'transparent' : '#000000',
      }}
    >
      {isMobile && (
        <Image
          src={loginBackground}
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          priority
        />
      )}

      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <DatePicker
          label="Select Date"
          value={selectedDate}
          onChange={handleDateChange}
          onAccept={(date) => {
            setSelectedDate(date);
            setSelectedTimeSlots({});
          }}
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '4px',
            marginBottom: 2,
            '& .MuiInputBase-root': {
              color: '#ffffff',
            },
            '& .MuiInputLabel-root': {
              color: '#ffffff',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#ffffff',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#ffffff',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#ffffff',
            },
            '& .MuiPickersDay-root': {
              color: '#000000',
              '&.Mui-selected': {
                backgroundColor: '#ffcc03',
                color: '#000000',
                '&:hover': {
                  backgroundColor: '#d9ad00',
                },
              },
            },
            '& .MuiPickersDay-today': {
              borderColor: '#ffcc03',
            },
            '& .MuiPickersCalendarHeader-label': {
              color: '#ffffff',
            },
            '& .MuiIconButton-root': {
              color: '#ffffff',
            },
            '& .MuiPickersDay-daySelected': {
              backgroundColor: '#ffcc03',
              color: '#000000',
            },
            '& .MuiDialogActions-root .MuiButton-text': {
              color: '#000000',
            },
          }}
        />
      </LocalizationProvider>

      <Typography variant="h6" sx={{ color: '#ffffff', marginBottom: 1, alignSelf: 'flex-start' }}>
        Group Size
      </Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <Select
          value={groupSize}
          onChange={(e) => setGroupSize(e.target.value)}
          displayEmpty
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#ffffff',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#ffffff',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#ffffff',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#ffffff',
            },
            '& .MuiSelect-icon': {
              color: '#ffffff',
            },
          }}
        >
          {[...Array(10)].map((_, i) => (
            <MenuItem key={i} value={i + 1}>
              {i + 1} {i === 0 ? 'Person' : 'People'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Grid container spacing={2}>
        {timeSlots.map((time) => {
          const availableSlots = 10 - (selectedTimeSlots[time] ? groupSize : 0);
          return (
            <Grid item xs={4} sm={3} md={2} key={time}>
              <Button
                onClick={() => handleTimeSlotToggle(time)}
                fullWidth
                sx={{
                  height: '80px',
                  flexDirection: 'column',
                  backgroundColor: selectedTimeSlots[time] ? '#ffcc03' : '#333333',
                  color: selectedTimeSlots[time] ? '#000000' : '#ffffff',
                  border: 'none',
                  '&:hover': {
                    backgroundColor: selectedTimeSlots[time] ? '#d9ad00' : '#444444',
                  },
                  '&.MuiButton-root': {
                    border: 'none',
                    outline: 'none',
                  },
                }}
              >
                <Typography variant="body2" sx={{ color: 'inherit' }}>{time}</Typography>
                <Typography variant="caption" sx={{ color: 'inherit' }}>{availableSlots} sims open</Typography>
              </Button>
            </Grid>
          );
        })}
      </Grid>

      <Slide direction="up" in={showTempBar} mountOnEnter unmountOnExit>
        <Paper
          elevation={4}
          sx={{
            position: 'fixed',
            bottom: '80px',
            left: 0,
            right: 0,
            width: '100%',
            backgroundColor: '#ffcc03',
            color: '#000',
            padding: '15px',
            textAlign: 'center',
            zIndex: 1001,
          }}
        >
          <Typography variant="body1" fontWeight="bold">
            Add extra half hours for $20 each!
          </Typography>
        </Paper>
      </Slide>

      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 20px',
          backgroundColor: '#000',
          color: '#fff',
          zIndex: 1000,
        }}
      >
        <Box>
          <Typography variant="body2">
            Selected: {Object.keys(selectedTimeSlots).join(', ')}
          </Typography>
          <Typography variant="body1">
            Total: ${calculateTotalPrice()}
          </Typography>
        </Box>
        <Button variant="contained" color="primary">
          Next
        </Button>
      </Paper>
    </Box>
  );
};

export default Schedule;