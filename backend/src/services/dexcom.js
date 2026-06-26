const axios = require('axios');

const DEXCOM_BASE_URL = 'https://api.dexcom.com';
const DEXCOM_AUTH_URL = 'https://api.dexcom.com/v2/oauth2';

function getAuthorizationUrl() {
  const params = new URLSearchParams({
    client_id: process.env.DEXCOM_CLIENT_ID,
    redirect_uri: process.env.DEXCOM_REDIRECT_URI,
    response_type: 'code',
    scope: 'offline_access egv calibration device statistics event',
  });
  return `${DEXCOM_AUTH_URL}/login?${params.toString()}`;
}

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

async function getDexcomUser(accessToken) {
  return { userId: 'default-user' };
}

async function fetchGlucoseReadings(accessToken, startDate, endDate) {
  function formatDate(date) {
    return date.toISOString().substring(0, 19);
  }
  const params = new URLSearchParams({
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  });
  
  const response = await axios.get(
    `${DEXCOM_BASE_URL}/v3/users/self/egvs?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.data.records || [];
}

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
