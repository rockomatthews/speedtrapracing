'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Avatar, IconButton, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useRouter } from 'next/navigation';
import EditIcon from '@mui/icons-material/Edit';
import { auth } from '../../config/firebase';
import { getUserProfile, updateUserProfile } from '../../utils/User';

const Profile = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        const userProfile = await getUserProfile(authUser.uid);
        setUser({ ...authUser, ...userProfile });
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleEditClick = () => {
    setEditName(user.displayName || '');
    setOpenDialog(true);
  };

  const handleSave = async () => {
    await updateUserProfile(user.uid, { displayName: editName });
    setUser({ ...user, displayName: editName });
    setOpenDialog(false);
  };

  const handleRaceClick = () => {
    router.push('/booking');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>No user found</div>;
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: '20px',
        position: 'relative',
      }}
    >
      <IconButton
        sx={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: '#FFC107',
          color: '#000',
          '&:hover': {
            backgroundColor: '#FFA000',
          },
        }}
        onClick={handleEditClick}
      >
        <EditIcon />
      </IconButton>

      <Avatar
        src={user.photoURL || '/profileImage.png'}
        alt="Profile Image"
        sx={{
          width: '120px',
          height: '120px',
          border: '5px solid #fff',
          marginBottom: '20px',
        }}
      />

      <Box
        sx={{
          backgroundColor: '#000',
          padding: '10px 20px',
          marginBottom: '10px',
          borderRadius: '10px',
          border: '2px solid #fff',
          textAlign: 'center',
        }}
      >
        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>
          Name
        </Typography>
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
          {user.displayName || 'No name set'}
        </Typography>
      </Box>

      <Box
        sx={{
          backgroundColor: '#000',
          padding: '10px 20px',
          borderRadius: '10px',
          border: '2px solid #fff',
          textAlign: 'center',
          marginBottom: '30px',
        }}
      >
        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>
          Email
        </Typography>
        <Typography variant="h6" sx={{ color: '#fff' }}>
          {user.email}
        </Typography>
      </Box>

      <Button
        variant="contained"
        sx={{
          backgroundColor: '#FFC107',
          color: '#000',
          fontWeight: 'bold',
          padding: '10px 40px',
          '&:hover': {
            backgroundColor: '#FFA000',
          },
        }}
        onClick={handleRaceClick}
      >
        Race
      </Button>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
