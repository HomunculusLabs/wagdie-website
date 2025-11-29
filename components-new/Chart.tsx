
import React from 'react';

interface Stat {
  label: string;
  value: number; // 0-100
}

interface ChartProps {
  stats: Stat[];
}

export const RadarChart: React.FC<ChartProps> = ({ stats }) => {
  const size = 200;
  const center = size / 2;
  const radius = (size / 2) - 40;
  const angleStep = (Math.PI * 2) / stats.length;

  // Helper to calculate points
  const getPoint = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2; // Start at top
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  };

  // Build polygon points string
  const points = stats.map((s, i) => getPoint(s.value, i)).join(' ');
  const fullPoints = stats.map((_, i) => getPoint(100, i)).join(' ');
  const midPoints = stats.map((_, i) => getPoint(50, i)).join(' ');

  return (
    <div className="relative w-fit mx-auto">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grids */}
        <polygon points={fullPoints} fill="none" stroke="#262626" strokeWidth="1" />
        <polygon points={midPoints} fill="none" stroke="#262626" strokeWidth="1" strokeDasharray="4 4" />
        
        {/* Axis Lines */}
        {stats.map((s, i) => {
            const p = getPoint(100, i);
            return <line key={i} x1={center} y1={center} x2={p.split(',')[0]} y2={p.split(',')[1]} stroke="#262626" />
        })}

        {/* The Data Shape */}
        <polygon 
            points={points} 
            fill="rgba(200, 170, 110, 0.2)" 
            stroke="#C8AA6E" 
            strokeWidth="2" 
            className="drop-shadow-[0_0_10px_rgba(200,170,110,0.3)]"
        />

        {/* Dots at vertices */}
        {stats.map((s, i) => {
            const [x, y] = getPoint(s.value, i).split(',');
            return <circle key={i} cx={x} cy={y} r="3" fill="#C8AA6E" />
        })}

        {/* Labels */}
        {stats.map((s, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const labelRadius = radius + 20;
            const x = center + labelRadius * Math.cos(angle);
            const y = center + labelRadius * Math.sin(angle);
            return (
                <text 
                    key={i} 
                    x={x} 
                    y={y} 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    fill="#737373" 
                    fontSize="10" 
                    className="font-display uppercase tracking-widest"
                >
                    {s.label}
                </text>
            )
        })}
      </svg>
    </div>
  );
};