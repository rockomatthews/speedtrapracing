'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import { db } from '../../config/firebase'; // Your Firebase config
import { collection, getDocs, deleteDoc, doc, getDoc, where, query } from 'firebase/firestore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width:600px)'); // Add media query
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        // Check if the user is in the AdminUsers collection
        const adminRef = doc(db, 'Users', user.uid);
        const adminSnap = await getDoc(adminRef);
        const userData = adminSnap.data()
        if (userData.isAdmin) {
          setIsAdmin(true); // User is an admin
        } else {
          router.push('/'); // Redirect non-admin users
        }
      } else if (!loading) {
        router.push('/login'); // Redirect unauthenticated users to login
      }
      setCheckingAdmin(false);
    };

    checkAdmin();
  }, [user, loading, router]);

  // Fetch bookings from Firestore
  const fetchBookings = async () => {
    try {
      const bookingsCollection = collection(db, 'bookings');
      const bookingsSnapshot = await getDocs(bookingsCollection);
      const bookingsList = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch user names for each booking
      const bookingsWithUserNames = await Promise.all(
        bookingsList.map(async (booking) => {
          const userDocRef = doc(db, 'Users', booking.user);
          const userDocSnap = await getDoc(userDocRef);
          let userName = 'Unknown';

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            userName = userData.displayName || 'Unknown';
          }

          return { ...booking, userName };
        })
      );

      setBookings(bookingsWithUserNames);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Delete booking function
  const handleDelete = async (id) => {
    try {
      // await deleteDoc(doc(db, 'bookings', id));
      // Refresh bookings list
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  if (loading || checkingAdmin) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000', color: '#fff' }}>
        <Typography variant="h1" sx={{ fontWeight: 'bold' }}>
          Hmm? 
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: '20px', backgroundColor: '#000', minHeight: '100vh' }}>
      <Typography
        variant="h4"
        sx={{ marginBottom: '20px', fontWeight: 'bold', color: '#fff' }}
      >
        Admin Dashboard - Bookings
      </Typography>

      {isLoading ? (
        <Typography sx={{ color: '#fff' }}>Loading...</Typography>
      ) : isMobile ? (
        // Mobile layout
        <Box>
          {bookings.map((booking) => (
            <Paper
              key={booking.id}
              sx={{
                marginBottom: 2,
                padding: 2,
                backgroundColor: '#1c1c1c',
                color: '#fff',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {booking.userName}
              </Typography>
              <Typography>Date: {booking.date}</Typography>
              <Typography>Time Slots:     
                {booking.timeSlots.map((slot, index) => (
                  <Box
                  key={index}
                  sx={{
                    display: 'inline-block',
                    backgroundColor: '#3f51b5', // Change to your desired color
                    color: '#fff',
                    padding: '5px 5px',
                    borderRadius: '5px',
                    margin: '5px',
                  }}
                  >
                        {slot}
                      </Box>
                    ))}
              </Typography>
              
              <Typography>Group Size / Sims: {booking.groupSize}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 1 }}>
                <IconButton
                  color="primary"
                  onClick={() => console.log('Edit booking', booking.id)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="secondary"
                  disabled={true}
                  onClick={() => handleDelete(booking.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        // Desktop layout (existing table)
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography sx={{ fontWeight: 'bold' }}>Name</Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 'bold' }}>Date</Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 'bold' }}>Time Slots</Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 'bold' }}>Group Size / Sims</Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 'bold' }}>Actions</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.userName}</TableCell>
                  <TableCell>{booking.date}</TableCell>
                  <TableCell>
                    {booking.timeSlots.map((slot, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'inline-block',
                          backgroundColor: '#3f51b5', // Change to your desired color
                          color: '#fff',
                          padding: '5px 10px',
                          borderRadius: '5px',
                          margin: '2px',
                        }}
                      >
                        {slot}
                      </Box>
                    ))}
                  </TableCell>
                  <TableCell>{booking.groupSize}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => console.log('Edit booking', booking.id)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="secondary"
                      disabled={true}
                      onClick={() => handleDelete(booking.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AdminDashboard;