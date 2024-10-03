// src/app/marketplace/page.js
'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import loginBackground from '../../public/loginBackground.png'; // Background image
import hatImage from '../../public/hat.jpg'
import shirtImage from '../../public/shirt.jpg'
import shirtTwoImage from '../../public/hat.jpg'

import './marketplace.css'; // Import custom CSS
const dummyData = [
  { id: 1, name: "Champion's Hat", price: 34.99, image: hatImage },
  { id: 2, name: 'T-Shirt', price: 20.99, image: shirtImage },
  { id: 3, name: 'White T-Shirt', price: 25.99, image: shirtTwoImage },
  { id: 4, name: 'Coat', price: 59.99, image: shirtImage },
];

const Marketplace = () => {
  // Carousel settings
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <Box sx={{ padding: '20px', backgroundColor: '#000', minHeight: '100vh' }}>
      {/* Header Section with Background */}
      <Box
        sx={{
          height: '300px',
          backgroundImage: `url(${loginBackground.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '30px',
        }}
      >
        <Typography
          variant="h3"
          sx={{ color: '#fff', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
        >
          Apparel
        </Typography>
        <Typography variant="h5" sx={{ color: '#fff', marginBottom: '20px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
          #speedtraphats
        </Typography>
        <Button
          variant="contained"
          sx={{ backgroundColor: '#FFC107', color: '#000', padding: '10px 30px', fontWeight: 'bold' }}
        >
          Checkout Now
        </Button>
      </Box>

      {/* Carousel for Categories */}
      <Box sx={{ marginBottom: '30px' }}>
        <Slider {...carouselSettings}>
          <Button
            sx={{
              backgroundColor: '#ff0000',
              color: '#fff',
              fontWeight: 'bold',
              padding: '10px 20px',
              margin: '10px',
              textTransform: 'none',
            }}
          >
            Hats
          </Button>
          <Button
            sx={{
              backgroundColor: '#ff0000',
              color: '#fff',
              fontWeight: 'bold',
              padding: '10px 20px',
              margin: '10px',
              textTransform: 'none',
            }}
          >
            Shirts
          </Button>
          <Button
            sx={{
              backgroundColor: '#ff0000',
              color: '#fff',
              fontWeight: 'bold',
              padding: '10px 20px',
              margin: '10px',
              textTransform: 'none',
            }}
          >
            Coats
          </Button>
          <Button
            sx={{
              backgroundColor: '#ff0000',
              color: '#fff',
              fontWeight: 'bold',
              padding: '10px 20px',
              margin: '10px',
              textTransform: 'none',
            }}
          >
            Gloves
          </Button>
        </Slider>
      </Box>

      {/* Grid for Merchandise */}
      <Grid container spacing={4}>
        {dummyData.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.id} className="grid-item">
            <Box
              sx={{
                backgroundColor: '#fff',
                borderRadius: '10px',
                overflow: 'hidden',
                textAlign: 'center',
              }}
            >
              <img src={item.image.src} alt={item.name} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />

              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '5px' }}
              >
                {item.name}
              </Typography>

              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#000', marginBottom: '15px' }}>
                ${item.price.toFixed(2)}
              </Typography>

            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Marketplace;
