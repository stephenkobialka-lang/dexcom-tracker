import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { getGlucoseColor } from '../utils/glucose';
import '../styles/GlucoseChart.css';

Chart.register(...registerables);

const LOW_LINE = 70;
const HIGH_LINE = 180;

export default function GlucoseChart({ readings, hours }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy old chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    if (!readings.length) return;

    const ctx = canvasRef.current.getContext('2d');

    const labels = readings.map(r =>
      new Date(r.displayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const values = readings.map(r => r.value);
    const pointColors = values.map(v => getGlucoseColor(v));

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Glucose (mg/dL)',
            data: values,
            borderColor: '#60A5FA',
            backgroundColor: 'rgba(96, 165, 250, 0.08)',
            pointBackgroundColor: pointColors,
            pointBorderColor: pointColors,
            pointRadius: readings.length > 200 ? 2 : 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1E293B',
            titleColor: '#94A3B8',
            bodyColor: '#F1F5F9',
            callbacks: {
              label: (ctx) => ` ${ctx.raw} mg/dL`,
            },
          },
          // Draw range bands
          afterDraw: null,
        },
        scales: {
          x: {
            ticks: {
              color: '#64748B',
              maxTicksLimit: 8,
              maxRotation: 0,
            },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
          y: {
            min: Math.max(40, Math.min(...values) - 20),
            max: Math.min(400, Math.max(...values) + 30),
            ticks: { color: '#64748B' },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
        },
      },
      plugins: [{
        id: 'rangeLines',
        beforeDraw(chart) {
          const { ctx, chartArea, scales } = chart;
          if (!chartArea) return;

          const yLow = scales.y.getPixelForValue(LOW_LINE);
          const yHigh = scales.y.getPixelForValue(HIGH_LINE);

          // Shade in-range zone
          ctx.save();
          ctx.fillStyle = 'rgba(34, 197, 94, 0.06)';
          ctx.fillRect(chartArea.left, yHigh, chartArea.width, yLow - yHigh);

          // Low line
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.6)';
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 1.5;
          ctx.moveTo(chartArea.left, yLow);
          ctx.lineTo(chartArea.right, yLow);
          ctx.stroke();

          // High line
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
          ctx.moveTo(chartArea.left, yHigh);
          ctx.lineTo(chartArea.right, yHigh);
          ctx.stroke();

          ctx.restore();
        },
      }],
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [readings]);

  if (!readings.length) {
    return (
      <div className="chart-empty">
        <p>No readings available for this time range</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="chart-legend">
        <span className="legend-item in-range">In range (70–180)</span>
        <span className="legend-item low">Low (&lt;70)</span>
        <span className="legend-item high">High (&gt;180)</span>
      </div>
      <div className="chart-canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
