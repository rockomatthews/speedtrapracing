const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccount.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const adminDb = admin.firestore();

module.exports = { adminDb };