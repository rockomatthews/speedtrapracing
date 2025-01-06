'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Grid, 
  Container,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import Image from 'next/image';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';

// Move Contentful client initialization inside the component
export default function RaceNightsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleClose = () => {
    setSelectedEvent(null);
  };

  const richTextOptions = {
    renderNode: {
      [BLOCKS.PARAGRAPH]: (node, children) => (
        <Typography variant="body1" paragraph>
          {children}
        </Typography>
      ),
      [BLOCKS.HEADING_1]: (node, children) => (
        <Typography variant="h4" gutterBottom>
          {children}
        </Typography>
      ),
      [BLOCKS.HEADING_2]: (node, children) => (
        <Typography variant="h5" gutterBottom>
          {children}
        </Typography>
      ),
      [INLINES.HYPERLINK]: (node, children) => (
        <a href={node.data.uri} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      ),
    },
  };

  useEffect(() => {
    async function fetchEvents() {
      try {
        console.log('Initializing Contentful client...');
        const { createClient } = await import('contentful');
        const client = createClient({
          space: '3iajpw2ce98w',
          accessToken: '2v6F-7uR9s-J3eq4q67G71l6k1uKEMWtgPCo6EIJX6o',
          environment: 'master'
        });

        console.log('Fetching entries...');
        const response = await client.getEntries({
          content_type: 'nightlyEvent',
          order: '-fields.date'
        });
        console.log('Contentful response:', response);
        setEvents(response.items);
      } catch (error) {
        console.error('Error fetching events:', error);
        console.error('Error details:', {
          space: '3iajpw2ce98w',
          error: error.message,
          stack: error.stack
        });
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const getImageUrl = (imageField) => {
    if (!imageField?.fields?.file?.url) return null;
    let url = imageField.fields.file.url;
    return url.startsWith('//') ? `https:${url}` : url;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Race Nights
      </Typography>

      <Grid container spacing={3}>
        {events.map((event) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={event.sys.id}>
            <Card 
              sx={{ 
                height: '100%', 
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 6
                }
              }}
              onClick={() => handleEventClick(event)}
            >
              {event.fields.heroImage && (
                <CardMedia
                  component="div"
                  sx={{ height: 200, position: 'relative' }}
                >
                  <Image
                    src={getImageUrl(event.fields.heroImage)}
                    alt={event.fields.title || 'Event image'}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </CardMedia>
              )}
              <CardContent>
                <Typography variant="h6" component="h2">
                  {event.fields.title}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {new Date(event.fields.date).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Event Details Dialog */}
      <Dialog 
        open={!!selectedEvent} 
        onClose={handleClose}
        maxWidth="lg"
        fullScreen
        sx={{
          '& .MuiDialog-paper': {
            margin: 0,
            width: '100%',
            maxWidth: '100%',
            height: '100%'
          }
        }}
      >
        {selectedEvent && (
          <>
            <Button 
              onClick={handleClose} 
              sx={{ 
                position: 'fixed',
                top: '20px',
                right: '20px',
                minWidth: '40px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'white',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                color: '#000',
                zIndex: 1300,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                fontSize: '20px'
              }}
            >
              ✕
            </Button>
            <DialogContent sx={{ p: 0 }}>
              {selectedEvent.fields.heroImage && (
                <Box sx={{ 
                  position: 'relative', 
                  width: '100%',
                  height: '50vh',
                  mb: 4 
                }}>
                  <Image
                    src={getImageUrl(selectedEvent.fields.heroImage)}
                    alt={selectedEvent.fields.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </Box>
              )}
              <Container maxWidth="lg" sx={{ pb: 4 }}>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {new Date(selectedEvent.fields.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
                {selectedEvent.fields.description && 
                  documentToReactComponents(selectedEvent.fields.description, richTextOptions)
                }
                {selectedEvent.fields.location && (
                  <Typography variant="body2" color="text.secondary">
                    Location: {selectedEvent.fields.location}
                  </Typography>
                )}
              </Container>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Container>
  );
}