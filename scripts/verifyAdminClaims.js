// scripts/verifyAdminClaims.js
const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function verifyAndFixAdminClaims() {
  try {
    const email = 'rob@speedtrapracing.com';
    const user = await admin.auth().getUserByEmail(email);
    
    console.log('Current user:', user.toJSON());
    console.log('Current custom claims:', user.customClaims);

    // Set both admin claim types (for redundancy)
    await admin.auth().setCustomUserClaims(user.uid, { 
      admin: true,
      isAdmin: true
    });

    // Verify Firestore document
    const userDoc = await admin.firestore()
      .collection('Users')
      .doc(user.uid)
      .get();

    if (!userDoc.exists) {
      await admin.firestore()
        .collection('Users')
        .doc(user.uid)
        .set({
          email: email,
          isAdmin: true,
          admin: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } else {
      await admin.firestore()
        .collection('Users')
        .doc(user.uid)
        .update({
          isAdmin: true,
          admin: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    // Verify final state
    const updatedUser = await admin.auth().getUser(user.uid);
    const updatedDoc = await admin.firestore()
      .collection('Users')
      .doc(user.uid)
      .get();

    console.log('\nUpdated state:');
    console.log('Auth claims:', updatedUser.customClaims);
    console.log('Firestore data:', updatedDoc.data());

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit();
}

verifyAndFixAdminClaims();