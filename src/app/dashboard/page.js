// src/app/admin-dashboard/page.js
'use client';
import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import { db } from '../../config/firebase'; // Your Firebase config
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch bookings from Firestore
  const fetchBookings = async () => {
    const bookingsCollection = collection(db, 'bookings');
    const bookingsSnapshot = await getDocs(bookingsCollection);
    const bookingsList = bookingsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setBookings(bookingsList);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Delete booking function
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'Bookings', id));
      // Refresh bookings list
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  return (
    <Box sx={{ padding: '40px', backgroundColor: '#000', minHeight: '100vh' }}>
      <Typography variant="h3" sx={{ marginBottom: '20px', fontWeight: 'bold' }}>
        Admin Dashboard - Bookings
      </Typography>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><Typography sx={{ fontWeight: 'bold' }}>Name</Typography></TableCell>
                <TableCell><Typography sx={{ fontWeight: 'bold' }}>Date</Typography></TableCell>
                <TableCell><Typography sx={{ fontWeight: 'bold' }}>Time</Typography></TableCell>
                <TableCell><Typography sx={{ fontWeight: 'bold' }}>Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.name}</TableCell>
                  <TableCell>{booking.date}</TableCell>
                  <TableCell>{booking.time}</TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => console.log('Edit booking', booking.id)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="secondary" onClick={() => handleDelete(booking.id)}>
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
