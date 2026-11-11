import React from 'react';
import { calculateSparklinePoints, calculateSparklinePath } from '../utils/sparkline';

interface KPISparklineProps {
  data: number[];
  color?: string;
  fill?: boolean;
  height?: number;
  width?: number | string;
  curve?: 'smooth' | 'linear';
  showPoints?: boolean;
}

export const KPISparkline: React.FC<KPISparklineProps> = ({
  data,
  color = '#2563eb',
  fill = true,
  height = 40,
  width = '100%',
  curve = 'smooth',
  showPoints = false,
}) => {
  const uid = React.useId();

  if (!data || data.length < 2) {
    return null;
  }

  const graphWidth = 100; // viewBox relative coordinates
  const points = calculateSparklinePoints(data, height, 4, graphWidth);
  const pathD = calculateSparklinePath(points, curve);
  const areaD = `${pathD} L ${graphWidth},${height} L 0,${height} Z`;

  const lastPoint = points[points.length - 1];
  const max = Math.max(...data);
  const peakPoint = points.find((p) => p.val === max);

  const gradientId = `kpi-sparkline-gradient-${uid.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div style={{ width: width, height, marginTop: '4px', overflow: 'hidden' }}>
      <svg
        viewBox={`0 0 ${graphWidth} ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {fill && <path d={areaD} fill={`url(#${gradientId})`} />}

        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Peak point marker if enabled */}
        {showPoints && peakPoint && (
          <circle
            cx={peakPoint.x}
            cy={peakPoint.y}
            r="2.5"
            fill="#38bdf8"
            stroke="#ffffff"
            strokeWidth="1"
          />
        )}

        {/* Last / current point pulse indicator */}
        {lastPoint && (
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={showPoints ? '3' : '2.5'}
            fill={color}
            stroke="#ffffff"
            strokeWidth="1.2"
          />
        )}
      </svg>
    </div>
  );
};
