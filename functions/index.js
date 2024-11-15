const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Hello from Firebase!' });
});

exports.api = functions.https.onRequest(app);