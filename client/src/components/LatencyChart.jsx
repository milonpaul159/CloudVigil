import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

/**
 * Custom tooltip for the latency chart.
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        fontSize: '0.8rem',
        backdropFilter: 'blur(8px)',
      }}
    >
      <p style={{ color: '#94a3b8', marginBottom: '0.4rem', fontSize: '0.75rem' }}>
        {label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, fontWeight: 600 }}>
          {entry.name}: {entry.value}ms
        </p>
      ))}
    </div>
  );
};

/**
 * Vibrant color palette for chart lines.
 */
const COLORS = [
  { stroke: '#38bdf8', fill: '#38bdf8' },
  { stroke: '#34d399', fill: '#34d399' },
  { stroke: '#f87171', fill: '#f87171' },
  { stroke: '#a78bfa', fill: '#a78bfa' },
  { stroke: '#fbbf24', fill: '#fbbf24' },
  { stroke: '#22d3ee', fill: '#22d3ee' },
];

/**
 * LatencyChart — Recharts AreaChart showing latency over time per endpoint.
 */
export default function LatencyChart({ analytics }) {
  if (!analytics || analytics.length === 0) return null;

  // Build unified time-series data from all endpoints' recentHistory
  const timeMap = new Map();

  analytics.forEach((endpoint) => {
    if (!endpoint.recentHistory) return;
    endpoint.recentHistory.forEach((ping) => {
      const time = new Date(ping.checkedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      if (!timeMap.has(time)) {
        timeMap.set(time, { time });
      }
      timeMap.get(time)[endpoint.name] = ping.latencyMs;
    });
  });

  // Sort by time and convert to array
  const chartData = Array.from(timeMap.values()).reverse();

  return (
    <div className="chart-section">
      <div className="glass-card chart-card">
        <div className="chart-header">
          <h3 className="chart-title">📈 Latency Over Time</h3>
          <div className="chart-legend">
            {analytics.map((ep, i) => (
              <div key={ep.name} className="legend-item">
                <span
                  className="legend-dot"
                  style={{ background: COLORS[i % COLORS.length].stroke }}
                />
                {ep.name}
              </div>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {analytics.map((ep, i) => (
                <linearGradient
                  key={ep.name}
                  id={`gradient-${i}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={COLORS[i % COLORS.length].fill}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={COLORS[i % COLORS.length].fill}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
              label={{
                value: 'ms',
                position: 'insideTopLeft',
                offset: 10,
                style: { fill: '#64748b', fontSize: 11 },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            {analytics.map((ep, i) => (
              <Area
                key={ep.name}
                type="monotone"
                dataKey={ep.name}
                stroke={COLORS[i % COLORS.length].stroke}
                fill={`url(#gradient-${i})`}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  stroke: COLORS[i % COLORS.length].stroke,
                  strokeWidth: 2,
                  fill: '#0a0e1a',
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
