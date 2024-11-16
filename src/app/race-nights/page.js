// src/app/race-nights/page.js
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from 'contentful';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Grid, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  useMediaQuery, 
  useTheme,
  Container 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';

// Initialize Contentful client with environment variables
const client = createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID,
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN,
});

// Helper function to ensure proper image URL formatting with production optimizations
const getImageUrl = (imageField) => {
  if (!imageField?.fields?.file?.url) {
    console.error('Invalid image field structure:', imageField);
    return null;
  }
  let url = imageField.fields.file.url;
  if (url.startsWith('//')) {
    url = `https:${url}`;
  }
  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  
  // For production, use the direct URL with quality parameters
  if (process.env.NODE_ENV === 'production') {
    // Add Contentful's image API parameters for optimization
    return `${url}?w=800&q=75&fm=webp`;
  }
  
  return url;
};

export default function NightlyEvents() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [open, setOpen] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.between('sm', 'lg'));

  const handleImageError = useCallback((eventId) => {
    console.error(`Image failed to load for event ${eventId}`);
    setImageLoadErrors(prev => ({ ...prev, [eventId]: true }));
  }, []);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await client.getEntries({
          content_type: 'nightlyEvent',
          order: 'fields.date',
          include: 2
        });
        setEvents(response.items);
      } catch (error) {
        console.error('Error fetching nightly events:', error);
      }
    }

    fetchEvents();
  }, []);

  const handleClickOpen = useCallback((event) => {
    setSelectedEvent(event);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Typography 
        variant="h4" 
        component="h1"
        gutterBottom 
        sx={{ 
          mb: { xs: 3, md: 4 },
          textAlign: { xs: 'center', md: 'left' }
        }}
      >
        Race Nights
      </Typography>

      <Grid container spacing={3}>
        {events.map((event, index) => (
          <Grid 
            item 
            xs={12}
            sm={6}
            md={4}
            lg={3} 
            key={event.sys.id}
          >
            <Card 
              onClick={() => handleClickOpen(event)} 
              sx={{ 
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
            >
              {event.fields.heroImage && !imageLoadErrors[event.sys.id] && (
                <CardMedia
                  component="div"
                  sx={{
                    height: { 
                      xs: 200,
                      sm: 220,
                      md: 240
                    },
                    position: 'relative'
                  }}
                >
                  <Image
                    src={getImageUrl(event.fields.heroImage)}
                    alt={event.fields.title || 'Race night event image'}
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 25vw"
                    style={{ objectFit: 'cover' }}
                    quality={75}
                    onError={() => handleImageError(event.sys.id)}
                    priority={index < 4}
                    unoptimized={process.env.NODE_ENV === 'production'}
                    loading={index < 4 ? 'eager' : 'lazy'}
                  />
                </CardMedia>
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography 
                  variant="h6"
                  component="h2"
                  sx={{
                    fontSize: { xs: '1.1rem', md: '1.25rem' },
                    lineHeight: 1.4
                  }}
                >
                  {event.fields.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {new Date(event.fields.date).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth={isMobile}
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : '80%',
            maxWidth: isMobile ? '100%' : '800px',
            margin: 0,
            height: isMobile ? '100%' : 'auto',
            maxHeight: isMobile ? '100%' : '90vh',
            borderRadius: isMobile ? 0 : 2,
            overflow: 'auto'
          },
        }}
      >
        {selectedEvent && (
          <>
            <DialogTitle 
              sx={{ 
                m: 0, 
                p: 3,
                position: 'relative',
                borderBottom: 1,
                borderColor: 'divider'
              }}
            >
              <Typography 
                variant="h5" 
                component="div"
                sx={{
                  fontWeight: 600
                }}
              >
                {selectedEvent.fields.title}
              </Typography>
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
            <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
              {selectedEvent.fields.heroImage && !imageLoadErrors[selectedEvent.sys.id] && (
                <Box 
                  sx={{ 
                    height: { xs: 250, sm: 300, md: 400 },
                    position: 'relative',
                    mb: 3,
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  <Image
                    src={getImageUrl(selectedEvent.fields.heroImage)}
                    alt={selectedEvent.fields.title || 'Race night detail image'}
                    fill
                    sizes="(max-width: 600px) 100vw, 800px"
                    style={{ objectFit: 'cover' }}
                    quality={75}
                    onError={() => handleImageError(selectedEvent.sys.id)}
                    priority={true}
                    unoptimized={process.env.NODE_ENV === 'production'}
                    loading="eager"
                  />
                </Box>
              )}
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 2 }}
              >
                Date: {new Date(selectedEvent.fields.date).toLocaleDateString()}
              </Typography>
              {selectedEvent.fields.description && (
                <Box 
                  sx={{ 
                    mt: 2,
                    '& p': {
                      fontSize: { xs: '0.9rem', md: '1rem' },
                      lineHeight: 1.7,
                      mb: 2
                    }
                  }}
                >
                  {documentToReactComponents(selectedEvent.fields.description)}
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Container>
  );
}