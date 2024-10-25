'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from 'contentful';
import { Box, Typography, Card, CardContent, CardMedia, Grid, Dialog, DialogTitle, DialogContent, IconButton, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';

const client = createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID,
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN,
});

export default function NightlyEvents() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await client.getEntries({
          content_type: 'nightlyEvent',
          order: 'fields.date',
        });
        setEvents(response.items);
      } catch (error) {
        console.error('Error fetching nightly events:', error);
      }
    }

    fetchEvents();
  }, []);

  const handleClickOpen = (event) => {
    setSelectedEvent(event);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Race Nights
      </Typography>
      <Grid container spacing={3}>
        {events.map((event) => (
          <Grid item xs={12} sm={6} md={4} key={event.sys.id}>
            <Card onClick={() => handleClickOpen(event)} sx={{ cursor: 'pointer' }}>
              {event.fields.heroImage && (
                <CardMedia
                  component="div"
                  sx={{ height: 200, position: 'relative' }}
                >
                  <Image
                    src={`https:${event.fields.heroImage.fields.file.url}`}
                    alt={event.fields.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </CardMedia>
              )}
              <CardContent>
                <Typography variant="h6">{event.fields.title}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        fullScreen={fullScreen}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '100%',
            margin: 0,
            height: fullScreen ? 'calc(100% - 64px)' : 'auto',
            top: fullScreen ? 64 : 'auto',
          },
        }}
      >
        {selectedEvent && (
          <>
            <DialogTitle 
              sx={{ 
                m: 0, 
                p: 2, 
                position: 'relative',
              }}
            >
              {selectedEvent.fields.title}
              <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              {selectedEvent.fields.heroImage && (
                <Box sx={{ height: 300, position: 'relative', mb: 2 }}>
                  <Image
                    src={`https:${selectedEvent.fields.heroImage.fields.file.url}`}
                    alt={selectedEvent.fields.title}
                    fill
                    sizes="100vw"
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </Box>
              )}
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Date: {new Date(selectedEvent.fields.date).toLocaleDateString()}
              </Typography>
              {selectedEvent.fields.description && (
                <Box sx={{ mt: 2 }}>
                  {documentToReactComponents(selectedEvent.fields.description)}
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}