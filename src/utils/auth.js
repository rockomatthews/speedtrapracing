import { auth } from '@/config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export async function signIn(email, password) {
  try {
    // Sign in with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get the ID token result which includes custom claims
    const idTokenResult = await user.getIdTokenResult();

    // Check if user is admin
    const isAdmin = idTokenResult.claims.admin === true;

    return { user, isAdmin };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
} 