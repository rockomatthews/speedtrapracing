'use client';
import React from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import RoomIcon from '@mui/icons-material/Room';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import simulator from '../../../public/blurBackground.jpeg';
import backgroundBlur from '../../../public/blurBackground.jpeg';

export default function Landing() {
  const router = useRouter();

  return (
    <Box sx={{ width: '100%', overflow: 'hidden', backgroundColor: '#000' }}>
      {/* HERO SECTION WITH VIDEO BACKGROUND */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100vh',      // Full viewport height
          display: 'flex',
          alignItems: 'center', // Vertically center content
          justifyContent: 'center', // Horizontally center content
        }}
      >
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={backgroundBlur.src} // Fallback image while video loads
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 2,
          }}
        >
          <source src="/videos/video-background.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Dark Overlay for readability */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1,
          }}
        />

        {/* HERO CONTENT */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            padding: '20px',
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              color: '#fff',
            }}
          >
            Experience the Thrill of iRacing!
          </Typography>
          <Typography
            variant="h5"
            sx={{
              marginTop: '10px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              color: '#fff',
            }}
          >
            State-of-the-art simulators. Realistic tracks. Competitive fun.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push('/schedule')}
            sx={{
              marginTop: '20px',
              backgroundColor: '#FFCC03',
              color: '#000',
              fontWeight: 'bold',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#E6B800',
              },
            }}
          >
            Book Your Race Today!
          </Button>
        </Box>
      </Box>

      {/* FEATURES SECTION */}
      <Box
        sx={{
          padding: '40px',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            marginBottom: '20px',
            textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
            color: '#fff',
          }}
        >
          Why Choose Speedtrap Racing?
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ backgroundColor: '#000', padding: '20px', borderRadius: '10px' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFCC03' }}>
                Immersive Experience
              </Typography>
              <Typography variant="body1" sx={{ marginTop: '10px', color: '#fff' }}>
                Feel the rush of real racing with ultra-realistic simulations and advanced hardware.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ backgroundColor: '#000', padding: '20px', borderRadius: '10px' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFCC03' }}>
                Competitive Fun
              </Typography>
              <Typography variant="body1" sx={{ marginTop: '10px', color: '#fff' }}>
                Challenge friends or compete in timed races for the ultimate bragging rights.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ backgroundColor: '#000', padding: '20px', borderRadius: '10px' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFCC03' }}>
                Perfect for Events
              </Typography>
              <Typography variant="body1" sx={{ marginTop: '10px', color: '#fff' }}>
                Whether it’s a birthday party, corporate event, or team building, we’ve got you covered.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* LOCATIONS SECTION */}
      <Box
        sx={{
          backgroundColor: '#FFF7E1',
          padding: '40px',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontWeight: 'bold',
            marginBottom: '20px',
            fontFamily: '"Poppins", sans-serif',
            color: '#333',
          }}
        >
          LOCATIONS
        </Typography>

        <Grid container spacing={4} sx={{ alignItems: 'center' }}>
          {/* Left Image */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Image
                src={simulator}
                alt="Children playing with a claw machine"
                layout="responsive"
                width={250}
                height={250}
              />
            </Box>
          </Grid>

          {/* Right Info */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* First Location */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <RoomIcon
                  sx={{
                    fontSize: '40px',
                    color: '#FF0000',
                    marginRight: '10px',
                  }}
                />
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      color: '#000',
                      fontFamily: '"Poppins", sans-serif',
                    }}
                  >
                    FT MYERS OFFICE
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#555' }}>
                    10105 Amberwood Rd STE 5, Fort Myers
                    <br />
                    +1 239-768-5647
                  </Typography>
                </Box>
              </Box>

              {/* Second Location */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <RoomIcon
                  sx={{
                    fontSize: '40px',
                    color: '#FF0000',
                    marginRight: '10px',
                  }}
                />
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      color: '#000',
                      fontFamily: '"Poppins", sans-serif',
                    }}
                  >
                    TAMPA OFFICE
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#555' }}>
                    2024 59th Terrace E, Bradenton
                    <br />
                    +1 941-538-5797
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* SIMULATOR IMAGE */}
      <Box
        sx={{
          marginTop: '50px',
          padding: '20px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Image
          src={simulator}
          alt="Racing Simulator"
          width={800}
          height={500}
          style={{ borderRadius: '10px' }}
        />
      </Box>

      {/* FOOTER */}
      <Box
        sx={{
          width: '100%',
          backgroundColor: '#000',
          padding: '20px 40px',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" sx={{ color: '#fff' }}>
          © {new Date().getFullYear()} Speedtrap Racing. All Rights Reserved.
        </Typography>
      </Box>
    </Box>
  );
}
