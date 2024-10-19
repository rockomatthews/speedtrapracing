const express = require('express');
const next = require('next');
const cors = require('cors');
const { login, verifyAuth, searchIRacingName, getLeagueSeasons, getLeagueSubsessions, getLeagueRoster, getRaceDetails, manualReAuth } = require('./src/utils/iRacingApi');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

const app = express();
const PORT = process.env.PORT || 3000;

// Update CORS settings to use environment variable or default to Render.com URL
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-frontend-url.onrender.com',
  credentials: true
}));

app.use(express.json());

// Middleware to check iRacing authentication
async function checkIRacingAuth(req, res, next) {
  try {
    const isAuthenticated = await verifyAuth();
    if (!isAuthenticated) {
      await login(process.env.IRACING_EMAIL, process.env.IRACING_PASSWORD);
    }
    next();
  } catch (error) {
    console.error('iRacing authentication error:', error);
    res.status(500).json({ error: 'iRacing authentication failed' });
  }
}

// Apply iRacing auth middleware only to /api/iracing routes
app.use('/api/iracing', checkIRacingAuth);

app.post('/api/iracing/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/iracing/verify-auth', async (req, res) => {
  try {
    const isAuthenticated = await verifyAuth();
    res.json({ isAuthenticated });
  } catch (error) {
    res.status(500).json({ error: 'Auth verification failed' });
  }
});

app.get('/api/iracing/search-iracing-name', async (req, res) => {
  try {
    const { name } = req.query;
    const result = await searchIRacingName(name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search iRacing name' });
  }
});

app.get('/api/iracing/league-seasons', async (req, res) => {
  try {
    const { leagueId } = req.query;
    const result = await getLeagueSeasons(leagueId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch league seasons' });
  }
});

app.get('/api/iracing/league-subsessions', async (req, res) => {
  try {
    const { leagueId, seasonId } = req.query;
    const result = await getLeagueSubsessions(leagueId, seasonId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch league subsessions' });
  }
});

app.get('/api/iracing/league-roster', async (req, res) => {
  try {
    const { leagueId } = req.query;
    const result = await getLeagueRoster(leagueId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch league roster' });
  }
});

app.get('/api/iracing/race-details', async (req, res) => {
  try {
    const { leagueId, seasonId, subsessionId } = req.query;
    const result = await getRaceDetails(leagueId, seasonId, subsessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch race details' });
  }
});

app.post('/api/iracing/manual-reauth', async (req, res) => {
  try {
    const result = await manualReAuth();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Manual re-authentication failed' });
  }
});

nextApp.prepare().then(() => {
  // Handle all other routes with Next.js
  app.all('*', (req, res) => {
    return nextHandler(req, res);
  });

  app.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});