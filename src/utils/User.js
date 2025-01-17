import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../config/firebase";

export const createUserProfile = async (user) => {
  const userRef = doc(db, "Users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { email, displayName, photoURL } = user;
    const createdAt = new Date();

    try {
      await setDoc(userRef, {
        email,
        displayName,
        photoURL,
        createdAt,
        iRacingName: '',
        isMember: false,
      });
    } catch (error) {
      console.error("Error creating user profile", error);
    }
  }

  return userRef;
};

export const getUserProfile = async (userId) => {
  const userRef = doc(db, "Users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data();
  } else {
    return null;
  }
};

export const updateUserProfile = async (userId, data) => {
  const userRef = doc(db, "Users", userId);
  try {
    await updateDoc(userRef, data);
  } catch (error) {
    console.error("Error updating user profile", error);
  }
};

export const updateMembershipStatus = async (userId, isMember) => {
  const userRef = doc(db, "Users", userId);
  try {
    await updateDoc(userRef, { isMember });
  } catch (error) {
    console.error("Error updating membership status", error);
  }
};