'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Avatar, IconButton, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Input } from '@mui/material';
import { useRouter } from 'next/navigation';
import EditIcon from '@mui/icons-material/Edit';
import { auth, db, storage } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Profile = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIRacingName, setEditIRacingName] = useState('');
  const [editPhoto, setEditPhoto] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        const userDocRef = doc(db, 'Users', authUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          // Create a new user document if it doesn't exist
          await updateDoc(userDocRef, {
            displayName: authUser.displayName || '',
            email: authUser.email,
            photoURL: authUser.photoURL || '',
            iRacingName: '',
            isMember: false,
          });
        }
        
        const userData = userDoc.data();
        setUser({ ...authUser, ...userData });
        setEditName(authUser.displayName || '');
        setEditIRacingName(userData?.iRacingName || '');
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleEditClick = () => {
    setOpenDialog(true);
  };

  const handlePhotoChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setEditPhoto(event.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (user) {
      try {
        const userDocRef = doc(db, 'Users', user.uid);
        let updateData = { 
          displayName: editName,
          iRacingName: editIRacingName
        };

        if (editPhoto) {
          const storageRef = ref(storage, `profilePhotos/${user.uid}`);
          await uploadBytes(storageRef, editPhoto);
          const photoURL = await getDownloadURL(storageRef);
          updateData.photoURL = photoURL;
        }

        await updateDoc(userDocRef, updateData);
        setUser({ ...user, ...updateData });
        setOpenDialog(false);
        setEditPhoto(null);
      } catch (error) {
        console.error("Error updating profile:", error);
        // You can also set an error state here to display to the user
      }
    }
  };

  const handleRaceClick = () => {
    router.push('/book');
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
          marginBottom: '10px',
        }}
      >
        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>
          Email
        </Typography>
        <Typography variant="h6" sx={{ color: '#fff' }}>
          {user.email}
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
          iRacing Name
        </Typography>
        <Typography variant="h6" sx={{ color: '#fff' }}>
          {user.iRacingName || 'Not set'}
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
        Race Now
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
          <TextField
            margin="dense"
            label="iRacing Name"
            type="text"
            fullWidth
            value={editIRacingName}
            onChange={(e) => setEditIRacingName(e.target.value)}
          />
          <Input
            type="file"
            onChange={handlePhotoChange}
            sx={{ marginTop: '20px' }}
          />
          {editPhoto && (
            <Typography variant="body2" sx={{ marginTop: '10px' }}>
              New photo selected: {editPhoto.name}
            </Typography>
          )}
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