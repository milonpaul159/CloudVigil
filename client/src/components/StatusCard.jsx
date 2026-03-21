/**
 * StatusCard — Individual endpoint status with pulse animation and metrics.
 * Clicking the card opens the endpoint detail modal.
 */
export default function StatusCard({ endpoint, onClick }) {
  const { name, url, uptimePercent, avgLatencyMs, latestStatus, totalPings } = endpoint;

  // Determine status tier
  const getStatus = () => {
    if (!latestStatus) return 'unknown';
    if (!latestStatus.isSuccess) return 'failing';
    if (latestStatus.latencyMs > 2000) return 'degraded';
    return 'healthy';
  };

  const status = getStatus();

  const statusLabels = {
    healthy: 'Operational',
    degraded: 'Degraded',
    failing: 'Down',
    unknown: 'Unknown',
  };

  return (
    <div
      className={`glass-card status-card ${status}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="status-card-header">
        <div>
          <div className="status-card-name">{name}</div>
          <div className="status-card-url">{url}</div>
        </div>
        <div className={`status-badge ${status}`}>
          <span className="badge-dot"></span>
          {statusLabels[status]}
        </div>
      </div>

      <div className="status-card-metrics">
        <div className="metric">
          <div className="metric-value">
            {latestStatus ? latestStatus.statusCode || '—' : '—'}
          </div>
          <div className="metric-label">Status</div>
        </div>
        <div className="metric">
          <div className="metric-value">
            {avgLatencyMs > 0 ? `${Math.round(avgLatencyMs)}` : '—'}
          </div>
          <div className="metric-label">Avg ms</div>
        </div>
        <div className="metric">
          <div className="metric-value">{uptimePercent}%</div>
          <div className="metric-label">Uptime</div>
        </div>
      </div>
    </div>
  );
}
