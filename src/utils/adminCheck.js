// src/utils/adminCheck.js
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function isUserAdmin(uid) {
  try {
    const userRef = doc(db, 'Users', uid);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() && userDoc.data().isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}