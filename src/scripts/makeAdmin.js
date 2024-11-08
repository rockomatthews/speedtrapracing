// src/scripts/makeAdmin.js
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyAs9Rl_ZO7avzPfBWgrRPzQ-fOLHFYVGl0",
  authDomain: "speedtrapracing-aa7c8.firebaseapp.com",
  projectId: "speedtrapracing-aa7c8",
  storageBucket: "speedtrapracing-aa7c8.appspot.com",
  messagingSenderId: "583692035652",
  appId: "1:583692035652:web:7dd8e0e066a0db79763e11"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function makeAdmin() {
  try {
    // Sign in
    const userCredential = await signInWithEmailAndPassword(auth, "rob@fastwebwork.com", "TrentStone69!");
    const userId = userCredential.user.uid;
    
    // Set admin privileges
    await setDoc(doc(db, 'Users', userId), {
      email: "rob@fastwebwork.com",
      isAdmin: true,
      displayName: "Rob",
      createdAt: new Date().toISOString()
    }, { merge: true });

    console.log("Admin privileges set successfully");
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Error code:", error.code);
  }
}

makeAdmin()
  .then(() => {
    console.log("Script completed");
    setTimeout(() => process.exit(0), 1000);
  })
  .catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
  });