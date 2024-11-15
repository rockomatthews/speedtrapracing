const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();
const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Firebase!' });
});

// Export the 2nd gen function
exports.api = onRequest({
  region: 'us-central1',
  memory: '256MiB',
  minInstances: 0,
  maxInstances: 10,
}, app);

// If you have other functions, make sure they're all 2nd gen
exports.hello = onRequest({
  region: 'us-central1',
  memory: '256MiB',
}, (req, res) => {
  res.send('Hello from Firebase v2!');
});