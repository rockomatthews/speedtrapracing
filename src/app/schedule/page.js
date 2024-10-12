'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography, Button, Grid, FormControl, Select, MenuItem, Paper, Slide, useMediaQuery } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';

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
        const time = new Date(2023, 0, 1, hour, minute);
        slots.push(time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
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
        backgroundColor: '#000000',
      }}
    >
      <Box sx={{ width: '100%', zIndex: 1, position: 'relative' }}>
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
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              marginBottom: 2,
              width: '100%',
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

        <Typography 
          variant="h6" 
          sx={{ 
            color: '#ffffff', 
            marginBottom: 1, 
            marginTop: 2,
            padding: '8px',
            borderRadius: '4px',
          }}
        >
          Group Size
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <Select
            value={groupSize}
            onChange={(e) => setGroupSize(e.target.value)}
            displayEmpty
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
      </Box>

      <Grid container spacing={2}>
        {timeSlots.map((time) => {
          const availableSlots = 10 - (selectedTimeSlots[time] ? groupSize : 0);
          return (
            <Grid item xs={6} sm={4} md={3} key={time}>
              <Button
                onClick={() => handleTimeSlotToggle(time)}
                fullWidth
                sx={{
                  height: { xs: '100px', sm: '80px' },
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
                <Typography variant="body2" sx={{ color: 'inherit', fontSize: { xs: '1rem', sm: '0.875rem' } }}>{time}</Typography>
                <Typography variant="caption" sx={{ color: 'inherit', fontSize: { xs: '0.875rem', sm: '0.75rem' } }}>{availableSlots} sims open</Typography>
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