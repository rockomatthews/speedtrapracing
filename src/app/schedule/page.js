'use client'

import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  FormControl,
  Select,
  MenuItem,
  Paper,
  Slide,
  useMediaQuery,
  Snackbar,
  Alert,
  TextField // Import TextField for renderInput
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { useRouter } from 'next/navigation';
import { DateTime } from 'luxon';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore'; // Import Firestore functions

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState({});
  const [groupSize, setGroupSize] = useState(1);
  const [showTempBar, setShowTempBar] = useState(false);
  const [error, setError] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]); // New state for bookings
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const today = DateTime.now();
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchBookingsForMonth(selectedDate);
    }
  }, [selectedDate]);

  const fetchBookingsForMonth = async (date) => {
    try {
      const startOfMonth = date.startOf('month').toISODate(); // 'YYYY-MM-DD'
      const endOfMonth = date.endOf('month').toISODate();

      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('date', '>=', startOfMonth),
        where('date', '<=', endOfMonth)
      );

      const querySnapshot = await getDocs(q);
      const fetchedBookings = [];
      querySnapshot.forEach((doc) => {
        fetchedBookings.push(doc.data());
      });

      setBookings(fetchedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  console.log("bookings: ",bookings)

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
    setSelectedTimeSlots((prevSlots) => {
      const newSlots = { ...prevSlots };
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

  const handleNextClick = () => {
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }
    if (Object.keys(selectedTimeSlots).length === 0) {
      setError('Please select at least one time slot');
      return;
    }
    const bookingDetails = {
      date: selectedDate.toISO().split('T')[0],
      timeSlots: Object.keys(selectedTimeSlots),
      groupSize: groupSize,
      totalPrice: calculateTotalPrice(),
      user: user.uid,
    };

    localStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));
    router.push('/payment');
  };

  const calculateAvailableSims = () => {
    const simsPerSlot = {};
    bookings.forEach((booking) => {
      const { date, timeSlots, groupSize } = booking;
      if (date === selectedDate.toISODate()) {
        timeSlots.forEach((timeSlot) => {
          if (simsPerSlot[timeSlot]) {
            simsPerSlot[timeSlot] += groupSize;
          } else {
            simsPerSlot[timeSlot] = groupSize;
          }
        });
      }
    });
    return simsPerSlot;
  };

  const simsPerSlot = useMemo(calculateAvailableSims, [bookings, selectedDate]);


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
            minDate={DateTime.now()}
            renderInput={(params) => (
              <TextField
                {...params}
                InputProps={{
                  ...params.InputProps,
                  readOnly: true,
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
            )}
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
          const bookedSims = simsPerSlot[time] || 0;
          const availableSims = 10 - bookedSims;

          // Parse the time string to get hour and minute
          const [timeString, meridiem] = time.split(' ');
          const [hourString, minuteString] = timeString.split(':');
          let hour = parseInt(hourString);
          const minute = parseInt(minuteString);
          if (meridiem === 'PM' && hour !== 12) {
            hour += 12;
          } else if (meridiem === 'AM' && hour === 12) {
            hour = 0;
          }

          // Create a DateTime object for the time slot
          const timeSlotDateTime = DateTime.fromObject(
            {
              year: selectedDate?.year,
              month: selectedDate?.month,
              day: selectedDate?.day,
              hour,
              minute,
            },
            { zone: DateTime.local().zoneName } // Ensure consistent time zone
          );

          // Get the current time in the same time zone
          const now = DateTime.now().setZone(DateTime.local().zoneName);

          // Check if the time slot is in the past
          const isPastTimeSlot = timeSlotDateTime < now;

          // Determine if the time slot should be disabled
          const isDisabled =
            (availableSims < groupSize && !selectedTimeSlots[time]) || isPastTimeSlot;

          return (
            <Grid item xs={6} sm={4} md={3} key={time}>
              <Button
                onClick={() => handleTimeSlotToggle(time)}
                fullWidth
                disabled={isDisabled}
                sx={{
                  height: { xs: '100px', sm: '80px' },
                  flexDirection: 'column',
                  backgroundColor: selectedTimeSlots[time]
                    ? '#ffcc03'
                    : '#333333',
                  color: selectedTimeSlots[time] ? '#000000' : '#ffffff',
                  border: 'none',
                  '&:hover': {
                    backgroundColor: selectedTimeSlots[time]
                      ? '#d9ad00'
                      : '#444444',
                  },
                  '&.MuiButton-root': {
                    border: 'none',
                    outline: 'none',
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'inherit',
                    fontSize: { xs: '1rem', sm: '0.875rem' },
                  }}
                >
                  {time}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'inherit',
                    fontSize: { xs: '0.875rem', sm: '0.75rem' },
                  }}
                >
                  {availableSims} sims open
                </Typography>
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
          <Typography variant="body1">Total: ${calculateTotalPrice()}</Typography>
        </Box>
        <Button variant="contained" color="primary" onClick={handleNextClick}>
          Next
        </Button>
      </Paper>
  
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
  
};

export default Schedule;