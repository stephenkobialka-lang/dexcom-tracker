const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const api = {
  // Auth
  getLoginUrl: () => `${API_URL}/auth/login`,

  async checkAuthStatus(userId) {
    const res = await fetch(`${API_URL}/auth/status/${userId}`);
    return res.json();
  },

  // Readings
  async getLatestReading(userId) {
    const res = await fetch(`${API_URL}/api/readings/latest?userId=${userId}`);
    return res.json();
  },

  async getReadings(userId, hours = 24) {
    const res = await fetch(`${API_URL}/api/readings?userId=${userId}&hours=${hours}`);
    return res.json();
  },

  // Alerts
  async getAlerts(userId, unacknowledgedOnly = false) {
    const res = await fetch(
      `${API_URL}/api/alerts?userId=${userId}&unacknowledgedOnly=${unacknowledgedOnly}`
    );
    return res.json();
  },

  async acknowledgeAlert(alertId, userId) {
    const res = await fetch(`${API_URL}/api/alerts/${alertId}/acknowledge`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  async acknowledgeAllAlerts(userId) {
    const res = await fetch(`${API_URL}/api/alerts/acknowledge-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  // Analysis
  async getLatestAnalysis(userId, period = 'DAILY') {
    const res = await fetch(
      `${API_URL}/api/analysis/latest?userId=${userId}&period=${period}`
    );
    return res.json();
  },

  async runAnalysis(userId, period = 'DAILY') {
    const res = await fetch(`${API_URL}/api/analysis/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, period }),
    });
    return res.json();
  },

  async getAnalysisHistory(userId, period, limit = 10) {
    const res = await fetch(
      `${API_URL}/api/analysis/history?userId=${userId}&period=${period}&limit=${limit}`
    );
    return res.json();
  },
};
