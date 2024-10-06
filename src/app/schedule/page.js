'use client'

import React, { useState } from 'react';
import { Box, Typography, Button, TextField } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { Calendar, luxonLocalizer, Views } from 'react-big-calendar';
import { DateTime } from 'luxon';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Image from 'next/image';
import loginBackground from '../../public/loginBackground.png';

const localizer = luxonLocalizer(DateTime);

const Schedule = () => {
  const [selectedDateTime, setSelectedDateTime] = useState(DateTime.now());
  const [events, setEvents] = useState([]);
  const [view, setView] = useState(Views.DAY);

  const handleDateTimeChange = (newDate) => {
    if (newDate) {
      setSelectedDateTime(newDate); // Ensure that newDate is valid and set it
    }
  };

  const handleSlotSelect = (slotInfo) => {
    const newEvent = {
      start: slotInfo.start,
      end: slotInfo.end,
      title: 'Selected Slot',
    };
    setEvents([...events, newEvent]);
  };

  const handleSubmit = () => {
    // You can handle form submission or navigation here
    console.log('Selected Date and Time:', selectedDateTime.toISO());
    console.log('Selected Events:', events);
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

      {/* Date and Time Picker */}
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <DateTimePicker
          label="Select Date and Time"
          value={selectedDateTime}
          onChange={handleDateTimeChange}
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

      {/* Calendar for Time Slot Selection */}
      <Box sx={{ width: '80%', height: '50vh', backgroundColor: '#000', padding: '10px', borderRadius: '5px', zIndex: 1 }}>
        <Calendar
          localizer={localizer}
          events={events}
          defaultView={view}
          views={['day', 'month']}
          step={30}
          timeslots={2}
          selectable
          onSelectSlot={handleSlotSelect}
          onView={() => setView(Views.DAY)}
          style={{ height: '100%' }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.title === 'Selected Slot' ? '#FFC107' : '#FFD700',
              border: 'none',
              borderRadius: '5px',
            },
          })}
        />
      </Box>

      {/* Submit Button */}
      <Button
        variant="contained"
        sx={{ backgroundColor: '#FFC107', color: '#000', padding: '10px 30px', marginTop: '20px', zIndex: 1 }}
        onClick={handleSubmit}
      >
        Confirm
      </Button>
    </Box>
  );
};

export default Schedule;