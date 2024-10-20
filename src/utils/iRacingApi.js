const axios = require('axios');

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://your-render-backend-url.onrender.com';

const instance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

function login(email, password) {
  return new Promise((resolve, reject) => {
    instance.post('/api/iracing/login', { email, password })
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        console.error('Login error:', error);
        reject(error);
      });
  });
}

function verifyAuth() {
  return new Promise((resolve, reject) => {
    instance.get('/api/iracing/verify-auth')
      .then((response) => {
        resolve(response.data.isAuthenticated);
      })
      .catch((error) => {
        console.error('Auth verification error:', error);
        resolve(false);
      });
  });
}

function searchIRacingName(name) {
  return new Promise((resolve, reject) => {
    instance.get('/api/search-iracing-name', { params: { name } })
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        console.error('Error searching iRacing name:', error);
        reject(error);
      });
  });
}

function getLeagueSeasons(leagueId) {
  return new Promise((resolve, reject) => {
    instance.get('/api/league-seasons', { params: { leagueId } })
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        console.error('Error fetching league seasons:', error);
        reject(error);
      });
  });
}

function getLeagueSubsessions(leagueId, seasonId) {
  return new Promise((resolve, reject) => {
    instance.get('/api/league-subsessions', { params: { leagueId, seasonId } })
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        console.error('Error fetching league subsessions:', error);
        reject(error);
      });
  });
}

function getLeagueRoster(leagueId) {
  return new Promise((resolve, reject) => {
    instance.get('/api/league-roster', { params: { leagueId } })
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        console.error('Error fetching league roster:', error);
        reject(error);
      });
  });
}

function getRaceDetails(leagueId, seasonId, subsessionId) {
  return new Promise((resolve, reject) => {
    instance.get('/api/race-details', { params: { leagueId, seasonId, subsessionId } })
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        console.error('Error fetching race details:', error);
        reject(error);
      });
  });
}

function manualReAuth() {
  return new Promise((resolve, reject) => {
    instance.post('/api/iracing/manual-reauth')
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        console.error('Manual re-authentication error:', error);
        reject(error);
      });
  });
}

module.exports = {
  login: login,
  verifyAuth: verifyAuth,
  searchIRacingName: searchIRacingName,
  getLeagueSeasons: getLeagueSeasons,
  getLeagueSubsessions: getLeagueSubsessions,
  getLeagueRoster: getLeagueRoster,
  getRaceDetails: getRaceDetails,
  manualReAuth: manualReAuth
};