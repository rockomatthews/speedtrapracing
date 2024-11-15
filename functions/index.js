const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.hello = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});