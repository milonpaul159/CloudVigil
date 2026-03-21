/**
 * PingHistory — Scrollable table of recent pings with color-coded rows.
 */
export default function PingHistory({ analytics }) {
  if (!analytics || analytics.length === 0) return null;

  // Flatten all recentHistory pings into a single sorted list
  const allPings = analytics
    .flatMap((ep) =>
      (ep.recentHistory || []).map((ping) => ({
        name: ep.name,
        url: ep.url,
        ...ping,
      }))
    )
    .sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt))
    .slice(0, 40); // Limit for performance

  const getLatencyClass = (ms) => {
    if (ms < 200) return 'fast';
    if (ms < 1000) return 'medium';
    return 'slow';
  };

  const formatTime = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="history-section">
      <h3 className="section-title">📋 Recent Ping History</h3>
      <div className="glass-card history-card">
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>URL</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Time</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {allPings.map((ping, i) => (
                <tr
                  key={i}
                  style={{
                    animation: `fadeIn 0.3s ease ${i * 0.02}s backwards`,
                  }}
                >
                  <td className="name-cell">{ping.name}</td>
                  <td className="url-cell" title={ping.url}>
                    {ping.url}
                  </td>
                  <td>
                    <span
                      className={`status-code ${
                        ping.isSuccess ? 'success' : 'error'
                      }`}
                    >
                      {ping.statusCode || 'ERR'}
                    </span>
                  </td>
                  <td className={`latency-cell ${getLatencyClass(ping.latencyMs)}`}>
                    {Math.round(ping.latencyMs)}ms
                  </td>
                  <td className="time-cell">{formatTime(ping.checkedAt)}</td>
                  <td className="error-cell" title={ping.errorMessage || ''}>
                    {ping.errorMessage || '—'}
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
