import {
  getGlucoseColor,
  getGlucoseStatus,
  getGlucoseBackground,
  TREND_ARROWS,
  TREND_LABELS,
  minutesAgo,
  isStale,
} from '../utils/glucose';
import '../styles/CurrentReading.css';

export default function CurrentReading({ reading }) {
  if (!reading) {
    return (
      <div className="current-reading no-data">
        <div className="reading-value">--</div>
        <div className="reading-status">No data yet</div>
        <div className="reading-meta">Connect your Dexcom account to begin</div>
      </div>
    );
  }

  const color = getGlucoseColor(reading.value);
  const status = getGlucoseStatus(reading.value);
  const bg = getGlucoseBackground(reading.value);
  const stale = isStale(reading.systemTime);
  const trend = TREND_ARROWS[reading.trend] || '→';
  const trendLabel = TREND_LABELS[reading.trend] || 'Steady';
  const ago = minutesAgo(reading.systemTime);

  return (
    <div className="current-reading" style={{ background: bg, borderColor: color }}>
      <div className="reading-top">
        <span className="reading-status-badge" style={{ color, borderColor: color }}>
          {status}
        </span>
        {stale && <span className="stale-badge">⚠ Stale</span>}
      </div>

      <div className="reading-main">
        <span className="reading-value" style={{ color }}>{reading.value}</span>
        <span className="reading-unit">mg/dL</span>
        <span className="reading-trend" style={{ color }} title={trendLabel}>
          {trend}
        </span>
      </div>

      <div className="reading-meta">
        <span className="trend-label">{trendLabel}</span>
        {reading.trendRate && (
          <span className="trend-rate">
            {reading.trendRate > 0 ? '+' : ''}{reading.trendRate.toFixed(1)} mg/dL/min
          </span>
        )}
        <span className="reading-time">{ago}</span>
      </div>
    </div>
  );
}
