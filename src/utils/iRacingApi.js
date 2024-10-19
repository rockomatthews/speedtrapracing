import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://your-render-backend-url.onrender.com';

const instance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export async function login(email, password) {
  try {
    const response = await instance.post('/api/iracing/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function verifyAuth() {
  try {
    const response = await instance.get('/api/iracing/verify-auth');
    return response.data.isAuthenticated;
  } catch (error) {
    console.error('Auth verification error:', error);
    return false;
  }
}

export async function searchIRacingName(name) {
  try {
    const response = await instance.get('/api/search-iracing-name', { params: { name } });
    return response.data;
  } catch (error) {
    console.error('Error searching iRacing name:', error);
    throw error;
  }
}

export async function getLeagueSeasons(leagueId) {
  try {
    const response = await instance.get('/api/league-seasons', { params: { leagueId } });
    return response.data;
  } catch (error) {
    console.error('Error fetching league seasons:', error);
    throw error;
  }
}

export async function getLeagueSubsessions(leagueId, seasonId) {
  try {
    const response = await instance.get('/api/league-subsessions', { params: { leagueId, seasonId } });
    return response.data;
  } catch (error) {
    console.error('Error fetching league subsessions:', error);
    throw error;
  }
}

export async function getLeagueRoster(leagueId) {
  try {
    const response = await instance.get('/api/league-roster', { params: { leagueId } });
    return response.data;
  } catch (error) {
    console.error('Error fetching league roster:', error);
    throw error;
  }
}

export async function getRaceDetails(leagueId, seasonId, subsessionId) {
  try {
    const response = await instance.get('/api/race-details', { params: { leagueId, seasonId, subsessionId } });
    return response.data;
  } catch (error) {
    console.error('Error fetching race details:', error);
    throw error;
  }
}

export async function manualReAuth() {
  try {
    const response = await instance.post('/api/iracing/manual-reauth');
    return response.data;
  } catch (error) {
    console.error('Manual re-authentication error:', error);
    throw error;
  }
}
