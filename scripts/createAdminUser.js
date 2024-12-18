   // scripts/createAdminUser.js
   const admin = require('firebase-admin');
    const serviceAccount = require('../config/firebase/serviceAccountKey.json');

   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
   });

   async function createAdminUser() {
     try {
       // Create the user
       const userRecord = await admin.auth().createUser({
         email: 'rob@speedtrapracing.com',
         password: 'RecessBoi69!', // Choose a strong password
         emailVerified: true
       });

       // Set custom claims
       await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

       // Create user document in Firestore
       await admin.firestore().collection('Users').doc(userRecord.uid).set({
         email: 'rob@speedtrapracing.com',
         isAdmin: true,
         createdAt: admin.firestore.FieldValue.serverTimestamp()
       });

       console.log('Successfully created admin user:', userRecord.uid);
     } catch (error) {
       console.error('Error creating admin user:', error);
     }
     process.exit();
   }

   createAdminUser();