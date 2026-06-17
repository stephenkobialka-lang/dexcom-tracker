import '../styles/StatsBar.css';

export default function StatsBar({ readings }) {
  if (!readings.length) return null;

  const values = readings.map(r => r.value);
  const inRange = values.filter(v => v >= 70 && v <= 180).length;
  const below = values.filter(v => v < 70).length;
  const above = values.filter(v => v > 180).length;
  const total = values.length;

  const tirPct = Math.round((inRange / total) * 100);
  const lowPct = Math.round((below / total) * 100);
  const highPct = Math.round((above / total) * 100);

  const avg = Math.round(values.reduce((a, b) => a + b, 0) / total);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <div className="stats-bar">
      <div className="stat-block">
        <div className="stat-value tir">{tirPct}%</div>
        <div className="stat-label">Time in Range</div>
        <div className="stat-sub">70–180 mg/dL</div>
      </div>
      <div className="stat-divider" />
      <div className="stat-block">
        <div className="stat-value low">{lowPct}%</div>
        <div className="stat-label">Below Range</div>
        <div className="stat-sub">&lt;70 mg/dL</div>
      </div>
      <div className="stat-divider" />
      <div className="stat-block">
        <div className="stat-value high">{highPct}%</div>
        <div className="stat-label">Above Range</div>
        <div className="stat-sub">&gt;180 mg/dL</div>
      </div>
      <div className="stat-divider" />
      <div className="stat-block">
        <div className="stat-value avg">{avg}</div>
        <div className="stat-label">Average</div>
        <div className="stat-sub">mg/dL</div>
      </div>
      <div className="stat-divider" />
      <div className="stat-block">
        <div className="stat-value neutral">{min}–{max}</div>
        <div className="stat-label">Range</div>
        <div className="stat-sub">mg/dL</div>
      </div>
    </div>
  );
}
