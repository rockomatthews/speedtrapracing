'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Avatar, IconButton, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Input, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import EditIcon from '@mui/icons-material/Edit';
import { auth, db, storage } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { searchIRacingName } from '../../utils/iRacingApi';

const Profile = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIRacingName, setEditIRacingName] = useState('');
  const [editPhoto, setEditPhoto] = useState(null);
  const [iRacingSearchResult, setIRacingSearchResult] = useState(null);
  const [iRacingSearchLoading, setIRacingSearchLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        const userDocRef = doc(db, 'Users', authUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
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
      }
    }
  };

  const handleRaceClick = () => {
    router.push('/book');
  };

  const handleIRacingNameSearch = async () => {
    setIRacingSearchLoading(true);
    setIRacingSearchResult(null);
    try {
      const result = await searchIRacingName(editIRacingName);
      setIRacingSearchResult(result);
      if (result.exists) {
        setEditIRacingName(result.name);
      }
    } catch (error) {
      console.error("Error searching iRacing name:", error);
      setIRacingSearchResult({ error: "An error occurred while searching. Please try again." });
    } finally {
      setIRacingSearchLoading(false);
    }
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
      {/* ... (rest of the JSX remains the same) ... */}

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
          <Box sx={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
            <TextField
              margin="dense"
              label="iRacing Name"
              type="text"
              fullWidth
              value={editIRacingName}
              onChange={(e) => setEditIRacingName(e.target.value)}
            />
            <Button onClick={handleIRacingNameSearch} disabled={iRacingSearchLoading} sx={{ marginLeft: '10px' }}>
              {iRacingSearchLoading ? <CircularProgress size={24} /> : 'Search'}
            </Button>
          </Box>
          {iRacingSearchResult && (
            <Typography variant="body2" sx={{ marginTop: '10px', color: iRacingSearchResult.exists ? 'green' : 'red' }}>
              {iRacingSearchResult.exists ? `Found: ${iRacingSearchResult.name}` : iRacingSearchResult.message || iRacingSearchResult.error}
            </Typography>
          )}
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
