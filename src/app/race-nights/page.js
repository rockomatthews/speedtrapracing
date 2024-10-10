'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from 'contentful';
import { Box, Typography, Card, CardContent, CardMedia, Grid } from '@mui/material';
import Image from 'next/image';

const client = createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID,
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN,
});

export default function NightlyEvents() {
  const [events, setEvents] = useState([]);

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

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Nightly Events
      </Typography>
      <Grid container spacing={3}>
        {events.map((event) => (
          <Grid item xs={12} sm={6} md={4} key={event.sys.id}>
            <Card>
              {event.fields.heroImage && (
                <CardMedia
                  component="div"
                  sx={{ height: 200, position: 'relative' }}
                >
                  <Image
                    src={`https:${event.fields.heroImage.fields.file.url}`}
                    alt={event.fields.title}
                    layout="fill"
                    objectFit="cover"
                  />
                </CardMedia>
              )}
              <CardContent>
                <Typography variant="h6">{event.fields.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Date: {new Date(event.fields.date).toLocaleDateString()}
                </Typography>
                <Typography variant="body2">{event.fields.description}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}