import { formatDateTime } from '../utils/glucose';
import '../styles/AnalysisPanel.css';

export default function AnalysisPanel({ analysis, onRunAnalysis, running }) {
  const suggestions = analysis?.aiSuggestions
    ? analysis.aiSuggestions.split('\n• ').filter(Boolean)
    : [];

  return (
    <div className="analysis-panel">
      <div className="panel-header">
        <h2>AI Insights</h2>
        <div className="analysis-actions">
          <button
            className="run-btn"
            onClick={() => onRunAnalysis('DAILY')}
            disabled={running}
          >
            {running ? 'Analyzing...' : '↻ Refresh'}
          </button>
          <button
            className="run-btn weekly"
            onClick={() => onRunAnalysis('WEEKLY')}
            disabled={running}
          >
            Weekly
          </button>
        </div>
      </div>

      {!analysis ? (
        <div className="analysis-empty">
          <p>Run an analysis to get AI-powered insights about glucose patterns.</p>
          <button
            className="run-btn primary"
            onClick={() => onRunAnalysis('DAILY')}
            disabled={running}
          >
            {running ? 'Analyzing...' : 'Run Daily Analysis'}
          </button>
        </div>
      ) : (
        <div className="analysis-content">
          <div className="analysis-period">
            {analysis.period} · Generated {formatDateTime(analysis.createdAt)}
          </div>

          {/* Stats grid */}
          <div className="analysis-stats">
            <div className="astat">
              <span className="astat-value tir">{analysis.timeInRange?.toFixed(1)}%</span>
              <span className="astat-label">Time in Range</span>
            </div>
            <div className="astat">
              <span className="astat-value">{analysis.avgGlucose}</span>
              <span className="astat-label">Avg mg/dL</span>
            </div>
            <div className="astat">
              <span className="astat-value">{analysis.gmi?.toFixed(1)}%</span>
              <span className="astat-label">GMI</span>
            </div>
            <div className="astat">
              <span className="astat-value">{analysis.cv?.toFixed(1)}%</span>
              <span className="astat-label">Variability</span>
            </div>
          </div>

          {/* AI Insights */}
          {analysis.aiInsights && (
            <div className="ai-section">
              <h3>Summary</h3>
              <p className="ai-insights">{analysis.aiInsights}</p>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="ai-section">
              <h3>Suggestions for your care team</h3>
              <ul className="ai-suggestions">
                {suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="analysis-disclaimer">
            AI insights are informational only. Always consult your endocrinologist before making treatment changes.
          </p>
        </div>
      )}
    </div>
  );
}
