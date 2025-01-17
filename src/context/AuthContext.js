// src/context/AuthContext.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';

const AuthContext = createContext({
  user: null,
  loading: true,
  isAdmin: false
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let unsubscribe;
    
    if (typeof window !== 'undefined' && auth) {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            // Check if user is admin
            const userDoc = await getDoc(doc(db, 'Users', user.uid));
            const isAdmin = userDoc.exists() && userDoc.data().isAdmin === true;
            setIsAdmin(isAdmin);
            setUser(user);
          } catch (error) {
            console.error('Error checking admin status:', error);
            setUser(null);
            setIsAdmin(false);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => unsubscribe && unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
