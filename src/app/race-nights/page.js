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
  CircularProgress 
} from '@mui/material';
import Image from 'next/image';

// Move Contentful client initialization inside the component
export default function RaceNightsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        // Initialize Contentful client inside the effect
        const { createClient } = await import('contentful');
        const client = createClient({
          space: '3iajpw2ce98w',
          accessToken: 'y-N5BHbGZ9rxpV9QJNJafcYH_8bCZkqGUBGzR4RUxiw',
        });

        const response = await client.getEntries({
          content_type: 'nightlyEvent',
          order: '-fields.date'
        });
        setEvents(response.items);
      } catch (error) {
        console.error('Error fetching events:', error);
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
            <Card sx={{ height: '100%' }}>
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
    </Container>
  );
}