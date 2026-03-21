import { useState, useCallback } from 'react';
import MatrixBackground from './components/MatrixBackground';
import { isAuthenticated, getUser, logout, fetchAnalytics, triggerPing } from './services/api';
import { usePolling } from './hooks/usePolling';
import LoginPage from './components/LoginPage';
import SummaryBar from './components/SummaryBar';
import StatusCard from './components/StatusCard';
import LatencyChart from './components/LatencyChart';
import PingHistory from './components/PingHistory';
import TrafficDashboard from './components/TrafficDashboard';
import ApiTester from './components/ApiTester';

export default function App() {
  const [user, setUser] = useState(isAuthenticated() ? getUser() : null);

  // Handle login success
  const handleLogin = (userData) => setUser(userData);

  // Handle logout
  const handleLogout = () => {
    logout();
    setUser(null);
  };

  // If not authenticated, show login screen
  if (!user) {
    return (
      <>
        <MatrixBackground />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <MatrixBackground />
      <Dashboard user={user} onLogout={handleLogout} />
    </>
  );
}

/**
 * Dashboard — Main monitoring view with auto-polling analytics.
 */
function Dashboard({ user, onLogout }) {
  const fetchFn = useCallback(() => fetchAnalytics(24), []);
  const { data, error, loading, refresh } = usePolling(fetchFn, 15000);

  const analytics = data?.analytics || [];

  // Manual ping trigger
  const handleTriggerPing = async () => {
    try {
      await triggerPing();
      // Refresh analytics after triggering
      setTimeout(refresh, 1000);
    } catch (err) {
      console.error('Ping trigger failed:', err.message);
    }
  };

  return (
    <div className="app-layout">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="app-header">
        <div className="logo">
          <h1>☁️ CloudVigil</h1>
          <span className="version-badge">v1.0</span>
        </div>

        <div className="header-actions">
          <div className="header-status">
            <span className="live-dot"></span>
            Live Monitoring
          </div>
          <button
            className="logout-btn"
            onClick={handleTriggerPing}
            style={{ color: 'var(--accent-blue)', borderColor: 'rgba(56,189,248,0.3)' }}
          >
            🔄 Ping Now
          </button>
          <button className="logout-btn" onClick={onLogout}>
            Logout ({user?.username})
          </button>
        </div>
      </header>

      {/* ── Dashboard Content ──────────────────────────────── */}
      <main className="dashboard">
        {loading && analytics.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Fetching monitoring data...</p>
          </div>
        ) : error && analytics.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <p>{error}</p>
            <button className="login-btn" style={{ width: 'auto', marginTop: '1rem', padding: '0.6rem 1.5rem' }} onClick={refresh}>
              Retry
            </button>
          </div>
        ) : analytics.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📡</div>
            <p>No monitoring data yet. Add targets via the API and trigger a ping.</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <SummaryBar analytics={analytics} />

            {/* Endpoint Status Cards */}
            <h3 className="section-title" style={{ animation: 'fadeInUp 0.4s ease 0.05s backwards' }}>
              🎯 Endpoint Status
            </h3>
            <div className="status-cards-grid">
              {analytics.map((ep, i) => (
                <StatusCard
                  key={ep.url}
                  endpoint={ep}
                />
              ))}
            </div>

            {/* API Tester */}
            <ApiTester />

            {/* Latency Chart */}
            <LatencyChart analytics={analytics} />

            {/* Ping History Table */}
            <PingHistory analytics={analytics} />

            {/* API Traffic Analytics */}
            <TrafficDashboard />
          </>
        )}
      </main>
    </div>
  );
}
