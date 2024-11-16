// src/components/AdminGuard.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAdmin } from '@/contexts/AdminContext';
import { CircularProgress, Box } from '@mui/material';

export default function AdminGuard({ children }) {
  const { isAdmin, loading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/login');
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return isAdmin ? children : null;
}