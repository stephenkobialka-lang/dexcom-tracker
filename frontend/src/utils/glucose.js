export const TREND_ARROWS = {
  NONE: '→',
  NOT_COMPUTABLE: '?',
  RATE_OUT_OF_RANGE: '↕',
  DOUBLE_DOWN: '↓↓',
  SINGLE_DOWN: '↓',
  FORTY_FIVE_DOWN: '↘',
  FLAT: '→',
  FORTY_FIVE_UP: '↗',
  SINGLE_UP: '↑',
  DOUBLE_UP: '↑↑',
};

export const TREND_LABELS = {
  DOUBLE_DOWN: 'Falling rapidly',
  SINGLE_DOWN: 'Falling',
  FORTY_FIVE_DOWN: 'Falling slowly',
  FLAT: 'Steady',
  FORTY_FIVE_UP: 'Rising slowly',
  SINGLE_UP: 'Rising',
  DOUBLE_UP: 'Rising rapidly',
};

export function getGlucoseColor(value) {
  if (value === null || value === undefined) return '#9CA3AF';
  if (value < 55) return '#DC2626';   // Critical low - red
  if (value < 70) return '#F97316';   // Low - orange
  if (value <= 180) return '#22C55E'; // In range - green
  if (value <= 250) return '#F59E0B'; // High - amber
  return '#EF4444';                   // Very high - red
}

export function getGlucoseStatus(value) {
  if (value === null || value === undefined) return 'Unknown';
  if (value < 55) return 'CRITICAL LOW';
  if (value < 70) return 'LOW';
  if (value <= 180) return 'IN RANGE';
  if (value <= 250) return 'HIGH';
  return 'VERY HIGH';
}

export function getGlucoseBackground(value) {
  if (value === null || value === undefined) return '#1F2937';
  if (value < 55) return 'rgba(220, 38, 38, 0.15)';
  if (value < 70) return 'rgba(249, 115, 22, 0.15)';
  if (value <= 180) return 'rgba(34, 197, 94, 0.10)';
  if (value <= 250) return 'rgba(245, 158, 11, 0.15)';
  return 'rgba(239, 68, 68, 0.15)';
}

export function formatTime(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function minutesAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m ago`;
}

export function isStale(dateStr, thresholdMinutes = 15) {
  if (!dateStr) return true;
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff > thresholdMinutes * 60000;
}
