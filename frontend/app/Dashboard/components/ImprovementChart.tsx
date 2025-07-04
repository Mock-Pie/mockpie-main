import React, { useState } from 'react';
import styles from '../page.module.css';

interface ImprovementChartProps {
  scores: number[];
  labels?: string[];
  year: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
}

// Helper to map scores to SVG Y coordinates (inverted, higher score = higher on chart)
const mapScoreToY = (score: number, maxScore = 10, chartHeight = 160, yOffset = 40) => {
  // SVG y=0 is top, so invert
  const normalized = Math.max(0, Math.min(score, maxScore)) / maxScore;
  return yOffset + (1 - normalized) * chartHeight;
};

const ImprovementChart: React.FC<ImprovementChartProps> = ({ scores, labels, year, availableYears, onYearChange }) => {
  // Chart dimensions
  const width = 500;
  const height = 200;
  const yOffset = 40;
  const chartHeight = 160;
  const maxScore = 10;
  const pointCount = scores.length;
  const step = pointCount > 1 ? (width - 50) / (pointCount - 1) : 0;

  // Tooltip state
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Generate points for the main line
  const points = scores.map((score, i) => {
    const x = i * step;
    const y = mapScoreToY(score, maxScore, chartHeight, yOffset);
    return { x, y };
  });

  // Generate SVG path for the line (simple linear for now)
  const linePath = points.map((pt, i) => (i === 0 ? `M${pt.x},${pt.y}` : `L${pt.x},${pt.y}`)).join(' ');

  // Area under the curve for gradient fill
  const areaPath =
    points.length > 0
      ? `${points.map((pt, i) => (i === 0 ? `M${pt.x},${pt.y}` : `L${pt.x},${pt.y}`)).join(' ')} L${points[points.length-1].x},${height} L0,${height} Z`
      : '';

  return (
    <div className={styles.improvementSection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>📈 Improvement Analytics</h3>
        <select
          className={styles.yearSelector}
          value={year}
          onChange={e => onYearChange(Number(e.target.value))}
        >
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <div className={styles.chartContainer}>
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9966FF" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#9966FF" stopOpacity="0.1"/>
              </linearGradient>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9966FF"/>
                <stop offset="50%" stopColor="#00FFCC"/>
                <stop offset="100%" stopColor="#FFD60A"/>
              </linearGradient>
            </defs>
            {/* Grid lines */}
            <g stroke="rgba(255,255,255,0.1)" strokeWidth="1">
              <line x1="0" y1="40" x2={width} y2="40"/>
              <line x1="0" y1="80" x2={width} y2="80"/>
              <line x1="0" y1="120" x2={width} y2="120"/>
              <line x1="0" y1="160" x2={width} y2="160"/>
            </g>
            {/* Area under the curve */}
            {areaPath && (
              <path d={areaPath} fill="url(#purpleGradient)" />
            )}
            {/* Main improvement line */}
            {linePath && (
              <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round"/>
            )}
            {/* Data points with hover handlers */}
            {points.map((pt, i) => (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="6"
                  fill={i === points.length-1 ? '#FFD60A' : '#9966FF'}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
                {/* Tooltip as SVG text */}
                {hoveredIdx === i && (
                  <g>
                    <rect
                      x={pt.x - 40}
                      y={pt.y - 38}
                      width="80"
                      height="40"
                      rx="8"
                      fill="rgba(30,30,30,0.95)"
                      stroke="#333"
                      strokeWidth="1"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 22}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#fff"
                      fontFamily="inherit"
                    >
                      {labels && labels[i] ? labels[i] : 'N/A'}
                    </text>
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#fff"
                      fontFamily="inherit"
                    >
                      Score: {scores[i]}
                    </text>
                  </g>
                )}
              </g>
            ))}
          </svg>
          {/* Chart labels */}
          <div style={{ position: 'absolute', bottom: '10px', left: '20px', fontSize: '12px', color: 'var(--light-grey)' }}>
            {labels && labels[0] ? labels[0] : 'Current Month'}
          </div>
          <div style={{ position: 'absolute', bottom: '10px', right: '20px', fontSize: '12px', color: 'var(--light-grey)' }}>
            {labels && labels[labels.length-1] ? labels[labels.length-1] : 'Peak Month'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovementChart;