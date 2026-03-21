import { useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { usePolling } from '../hooks/usePolling';
import { fetchTraffic } from '../services/api';

/**
 * Custom tooltip for traffic charts.
 */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '0.6rem 0.8rem',
        fontSize: '0.8rem',
        backdropFilter: 'blur(8px)',
      }}
    >
      <p style={{ color: '#94a3b8', marginBottom: '0.3rem' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || '#38bdf8', fontWeight: 600 }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
};

const METHOD_COLORS = {
  GET: '#38bdf8',
  POST: '#34d399',
  PUT: '#fbbf24',
  DELETE: '#f87171',
  PATCH: '#a78bfa',
  OPTIONS: '#64748b',
};

const PIE_COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee'];

/**
 * TrafficDashboard — API traffic analytics with charts and tables.
 */
export default function TrafficDashboard() {
  const fetchFn = useCallback(() => fetchTraffic(24), []);
  const { data, loading } = usePolling(fetchFn, 15000);

  const traffic = data?.traffic;

  if (loading && !traffic) {
    return (
      <div className="loading-container" style={{ minHeight: '200px' }}>
        <div className="spinner"></div>
        <p className="loading-text">Loading traffic data...</p>
      </div>
    );
  }

  if (!traffic || traffic.totalRequests === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem' }}>
        <div className="empty-icon">🚦</div>
        <p>No API traffic recorded yet. Start making requests!</p>
      </div>
    );
  }

  return (
    <div className="traffic-dashboard">
      <h3 className="section-title" style={{ animation: 'fadeInUp 0.4s ease 0.3s backwards' }}>
        🚦 API Traffic Analytics
      </h3>

      {/* Traffic Summary Counts */}
      <div className="traffic-summary">
        <div className="glass-card summary-item">
          <div className="summary-label">Total Requests</div>
          <div className="summary-value blue">{traffic.totalRequests.toLocaleString()}</div>
        </div>
        <div className="glass-card summary-item">
          <div className="summary-label">Unique Routes</div>
          <div className="summary-value green">{traffic.byRoute.length}</div>
        </div>
        <div className="glass-card summary-item">
          <div className="summary-label">Active Users</div>
          <div className="summary-value amber">{traffic.topUsers.length}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="traffic-charts-row">
        {/* Routes Bar Chart */}
        <div className="glass-card chart-card traffic-chart-half">
          <h4 className="chart-title">📊 Requests by Route</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={traffic.byRoute.slice(0, 8)}
              margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="path"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b', angle: -35, textAnchor: 'end' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
                height={70}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="count"
                name="Requests"
                fill="#38bdf8"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Method Pie Chart */}
        <div className="glass-card chart-card traffic-chart-half">
          <h4 className="chart-title">🔄 By HTTP Method</h4>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={traffic.byMethod}
                dataKey="count"
                nameKey="method"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={3}
                label={({ method, count }) => `${method}: ${count}`}
                labelLine={{ stroke: '#64748b' }}
              >
                {traffic.byMethod.map((entry, i) => (
                  <Cell
                    key={entry.method}
                    fill={METHOD_COLORS[entry.method] || PIE_COLORS[i % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="glass-card history-card" style={{ marginTop: '1rem' }}>
        <h4 className="chart-title" style={{ marginBottom: '1rem' }}>📋 Recent API Requests</h4>
        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Status</th>
                <th>Response</th>
                <th>User</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {traffic.recentRequests.map((req, i) => (
                <tr key={req._id || i}>
                  <td>
                    <span
                      className="method-badge"
                      style={{
                        color: METHOD_COLORS[req.method] || '#94a3b8',
                        background: `${METHOD_COLORS[req.method] || '#94a3b8'}15`,
                        border: `1px solid ${METHOD_COLORS[req.method] || '#94a3b8'}30`,
                      }}
                    >
                      {req.method}
                    </span>
                  </td>
                  <td className="url-cell" title={req.path} style={{ maxWidth: '250px' }}>
                    {req.path}
                  </td>
                  <td>
                    <span className={`status-code ${req.statusCode < 400 ? 'success' : 'error'}`}>
                      {req.statusCode}
                    </span>
                  </td>
                  <td className={`latency-cell ${req.responseTimeMs < 100 ? 'fast' : req.responseTimeMs < 500 ? 'medium' : 'slow'}`}>
                    {Math.round(req.responseTimeMs)}ms
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{req.user}</td>
                  <td className="time-cell">
                    {new Date(req.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
