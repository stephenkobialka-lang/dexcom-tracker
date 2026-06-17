import { useState, useEffect, useCallback } from 'react';
import CurrentReading from '../components/CurrentReading';
import GlucoseChart from '../components/GlucoseChart';
import AlertsPanel from '../components/AlertsPanel';
import AnalysisPanel from '../components/AnalysisPanel';
import StatsBar from '../components/StatsBar';
import { api } from '../utils/api';
import '../styles/Dashboard.css';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function Dashboard({ userId, onLogout }) {
  const [latestReading, setLatestReading] = useState(null);
  const [readings, setReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [chartHours, setChartHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [runningAnalysis, setRunningAnalysis] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [latestRes, readingsRes, alertsRes, analysisRes] = await Promise.all([
        api.getLatestReading(userId),
        api.getReadings(userId, chartHours),
        api.getAlerts(userId, false),
        api.getLatestAnalysis(userId, 'DAILY'),
      ]);

      if (latestRes.reading) setLatestReading(latestRes.reading);
      if (readingsRes.readings) setReadings(readingsRes.readings);
      if (alertsRes.alerts) setAlerts(alertsRes.alerts);
      if (analysisRes.report) setAnalysis(analysisRes.report);

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, chartHours]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRunAnalysis = async (period = 'DAILY') => {
    setRunningAnalysis(true);
    try {
      const result = await api.runAnalysis(userId, period);
      if (result.report) setAnalysis(result.report);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setRunningAnalysis(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    await api.acknowledgeAlert(alertId, userId);
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, acknowledged: true } : a
    ));
  };

  const handleAcknowledgeAll = async () => {
    await api.acknowledgeAllAlerts(userId);
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
  };

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading glucose data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="header-title">
            <span className="header-icon">💙</span>
            Glucose Tracker
          </h1>
          {lastRefresh && (
            <span className="header-refresh">
              Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="header-right">
          {unacknowledgedAlerts.length > 0 && (
            <span className="alert-badge">{unacknowledgedAlerts.length} alert{unacknowledgedAlerts.length > 1 ? 's' : ''}</span>
          )}
          <button className="refresh-btn" onClick={fetchData}>↻ Refresh</button>
          <button className="logout-btn" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Top row: current reading + stats */}
        <div className="top-row">
          <CurrentReading reading={latestReading} />
          <StatsBar readings={readings} />
        </div>

        {/* Chart */}
        <div className="chart-section">
          <div className="chart-header">
            <h2>Glucose History</h2>
            <div className="chart-controls">
              {[3, 6, 12, 24, 48].map(h => (
                <button
                  key={h}
                  className={`hours-btn ${chartHours === h ? 'active' : ''}`}
                  onClick={() => setChartHours(h)}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
          <GlucoseChart readings={readings} hours={chartHours} />
        </div>

        {/* Bottom row: alerts + AI analysis */}
        <div className="bottom-row">
          <AlertsPanel
            alerts={alerts}
            onAcknowledge={handleAcknowledgeAlert}
            onAcknowledgeAll={handleAcknowledgeAll}
          />
          <AnalysisPanel
            analysis={analysis}
            onRunAnalysis={handleRunAnalysis}
            running={runningAnalysis}
          />
        </div>
      </main>
    </div>
  );
}
