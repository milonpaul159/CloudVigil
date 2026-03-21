/**
 * SummaryBar — Top-level aggregate metrics strip.
 * Shows: Total Pings, Overall Uptime %, Avg Latency, Failing Endpoints.
 */
export default function SummaryBar({ analytics }) {
  if (!analytics || analytics.length === 0) return null;

  // Aggregate across all endpoints
  const totalPings = analytics.reduce((sum, a) => sum + a.totalPings, 0);
  const totalSuccess = analytics.reduce((sum, a) => sum + a.successfulPings, 0);
  const overallUptime = totalPings > 0
    ? (totalSuccess / totalPings * 100).toFixed(1)
    : '0.0';

  const avgLatencies = analytics
    .filter((a) => a.avgLatencyMs > 0)
    .map((a) => a.avgLatencyMs);
  const overallAvgLatency = avgLatencies.length > 0
    ? (avgLatencies.reduce((a, b) => a + b, 0) / avgLatencies.length).toFixed(1)
    : '0';

  const failingCount = analytics.filter(
    (a) => a.latestStatus && !a.latestStatus.isSuccess
  ).length;

  const uptimeColor = overallUptime >= 99 ? 'green' : overallUptime >= 90 ? 'amber' : 'red';
  const latencyColor = overallAvgLatency < 200 ? 'green' : overallAvgLatency < 1000 ? 'amber' : 'red';

  return (
    <div className="summary-bar">
      <div className="glass-card summary-item">
        <div className="summary-label">Total Pings</div>
        <div className="summary-value blue">{totalPings.toLocaleString()}</div>
        <div className="summary-sub">across {analytics.length} endpoints</div>
      </div>

      <div className="glass-card summary-item">
        <div className="summary-label">Overall Uptime</div>
        <div className={`summary-value ${uptimeColor}`}>{overallUptime}%</div>
        <div className="summary-sub">{totalSuccess} successful pings</div>
      </div>

      <div className="glass-card summary-item">
        <div className="summary-label">Avg Latency</div>
        <div className={`summary-value ${latencyColor}`}>{overallAvgLatency}ms</div>
        <div className="summary-sub">mean response time</div>
      </div>

      <div className="glass-card summary-item">
        <div className="summary-label">Failing</div>
        <div className={`summary-value ${failingCount > 0 ? 'red' : 'green'}`}>
          {failingCount}
        </div>
        <div className="summary-sub">
          {failingCount > 0 ? 'endpoints down' : 'all systems operational'}
        </div>
      </div>
    </div>
  );
}
