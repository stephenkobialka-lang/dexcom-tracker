const axios = require('axios');

const DEXCOM_BASE_URL = 'https://api.dexcom.com';
const DEXCOM_AUTH_URL = 'https://api.dexcom.com/v3/oauth2';

/**
 * Build the Dexcom OAuth2 authorization URL
 */
function getAuthorizationUrl() {
  const params = new URLSearchParams({
    client_id: process.env.DEXCOM_CLIENT_ID,
    redirect_uri: process.env.DEXCOM_REDIRECT_URI,
    response_type: 'code',
    scope: 'offline_access',
  });
  return `https://api.dexcom.com/v2/oauth2/login?${params.toString()}`;
}

/**
 * Exchange authorization code for access + refresh tokens
 */
async function exchangeCodeForTokens(code) {
  const response = await axios.post(`${DEXCOM_AUTH_URL}/token`, new URLSearchParams({
    client_id: process.env.DEXCOM_CLIENT_ID,
    client_secret: process.env.DEXCOM_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: process.env.DEXCOM_REDIRECT_URI,
  }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
}

/**
 * Refresh an expired access token
 */
async function refreshAccessToken(refreshToken) {
  const response = await axios.post(`${DEXCOM_AUTH_URL}/token`, new URLSearchParams({
    client_id: process.env.DEXCOM_CLIENT_ID,
    client_secret: process.env.DEXCOM_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    redirect_uri: process.env.DEXCOM_REDIRECT_URI,
  }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
}

/**
 * Get the authenticated Dexcom user's info
 */
async function getDexcomUser(accessToken) {
  const response = await axios.get(`${DEXCOM_BASE_URL}/v3/users/self`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

/**
 * Fetch glucose readings from the Dexcom API
 * @param {string} accessToken
 * @param {Date} startDate
 * @param {Date} endDate
 */
async function fetchGlucoseReadings(accessToken, startDate, endDate) {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const response = await axios.get(
    `${DEXCOM_BASE_URL}/v3/users/self/egvs?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return response.data.records || [];
}

/**
 * Map a raw Dexcom reading to our DB schema
 */
function mapReading(raw) {
  return {
    systemTime: new Date(raw.systemTime),
    displayTime: new Date(raw.displayTime),
    value: raw.value,
    trend: raw.trend || null,
    trendRate: raw.trendRate || null,
    status: raw.status || null,
  };
}

module.exports = {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getDexcomUser,
  fetchGlucoseReadings,
  mapReading,
};
