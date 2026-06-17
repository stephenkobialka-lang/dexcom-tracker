import { formatDateTime } from '../utils/glucose';
import '../styles/AlertsPanel.css';

const ALERT_ICONS = {
  HIGH: '⬆',
  LOW: '⬇',
  RAPID_RISE: '⚡',
  RAPID_FALL: '⚡',
};

const ALERT_COLORS = {
  HIGH: '#F59E0B',
  LOW: '#F97316',
  RAPID_RISE: '#EF4444',
  RAPID_FALL: '#EF4444',
};

export default function AlertsPanel({ alerts, onAcknowledge, onAcknowledgeAll }) {
  const unack = alerts.filter(a => !a.acknowledged);

  return (
    <div className="alerts-panel">
      <div className="panel-header">
        <h2>Alerts</h2>
        {unack.length > 0 && (
          <button className="ack-all-btn" onClick={onAcknowledgeAll}>
            Clear all
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="alerts-empty">
          <span className="empty-icon">✓</span>
          <p>No alerts</p>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.slice(0, 10).map(alert => (
            <div
              key={alert.id}
              className={`alert-item ${alert.acknowledged ? 'acknowledged' : ''}`}
              style={{ borderLeftColor: ALERT_COLORS[alert.type] || '#64748B' }}
            >
              <div className="alert-top">
                <span className="alert-icon" style={{ color: ALERT_COLORS[alert.type] }}>
                  {ALERT_ICONS[alert.type] || '!'}
                </span>
                <span className="alert-type">{alert.type.replace('_', ' ')}</span>
                <span className="alert-time">{formatDateTime(alert.triggeredAt)}</span>
                {!alert.acknowledged && (
                  <button
                    className="ack-btn"
                    onClick={() => onAcknowledge(alert.id)}
                    title="Dismiss"
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="alert-message">{alert.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
