'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CircularProgress } from '@mui/material';

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      router.push('/login?from=/admin');
      return;
    }

    // Check admin status
    if (user) {
      user.getIdTokenResult().then(idTokenResult => {
        if (!idTokenResult.claims.admin) {
          router.push('/login?from=/admin');
        }
      });
    }
  }, [user, loading, router]);

  if (loading) {
    return <CircularProgress />;
  }

  return children;
}