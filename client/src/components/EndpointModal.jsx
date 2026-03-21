import { useState, useEffect } from 'react';
import { testUrl } from '../services/api';

/**
 * EndpointModal — Hacker-themed modal showing endpoint details
 * and live API response data when clicking a status card.
 */
export default function EndpointModal({ endpoint, onClose }) {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { name, url, uptimePercent, avgLatencyMs, latestStatus, totalPings, successfulPings, recentPings } = endpoint;

  // Fetch live data from the endpoint URL when modal opens
  useEffect(() => {
    let cancelled = false;

    const fetchLive = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await testUrl(url, 'GET');
        if (!cancelled) setLiveData(data.result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLive();
    return () => { cancelled = true; };
  }, [url]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Determine status
  const getStatus = () => {
    if (!latestStatus) return 'unknown';
    if (!latestStatus.isSuccess) return 'failing';
    if (latestStatus.latencyMs > 2000) return 'degraded';
    return 'healthy';
  };
  const status = getStatus();

  const statusLabels = {
    healthy: '● OPERATIONAL',
    degraded: '● DEGRADED',
    failing: '● DOWN',
    unknown: '● UNKNOWN',
  };

  const statusColors = {
    healthy: '#39ff14',
    degraded: '#ccff00',
    failing: '#ff3131',
    unknown: '#3a6b4a',
  };

  const failedPings = (totalPings || 0) - (successfulPings || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-area">
            <h2 className="modal-title">{name || 'Endpoint Details'}</h2>
            <span className="modal-status-badge" style={{ color: statusColors[status] }}>
              {statusLabels[status]}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* URL Display */}
        <div className="modal-url-bar">
          <span className="modal-url-label">&gt; TARGET</span>
          <code className="modal-url-value">{url}</code>
        </div>

        {/* Metrics Grid */}
        <div className="modal-metrics-grid">
          <div className="modal-metric-box">
            <div className="modal-metric-label">STATUS CODE</div>
            <div className="modal-metric-value" style={{ color: latestStatus?.isSuccess ? '#39ff14' : '#ff3131' }}>
              {latestStatus?.statusCode || '—'}
            </div>
          </div>
          <div className="modal-metric-box">
            <div className="modal-metric-label">AVG LATENCY</div>
            <div className="modal-metric-value" style={{ color: avgLatencyMs < 200 ? '#39ff14' : avgLatencyMs < 1000 ? '#ccff00' : '#ff3131' }}>
              {avgLatencyMs > 0 ? `${Math.round(avgLatencyMs)}ms` : '—'}
            </div>
          </div>
          <div className="modal-metric-box">
            <div className="modal-metric-label">UPTIME</div>
            <div className="modal-metric-value" style={{ color: uptimePercent >= 99 ? '#39ff14' : uptimePercent >= 90 ? '#ccff00' : '#ff3131' }}>
              {uptimePercent}%
            </div>
          </div>
          <div className="modal-metric-box">
            <div className="modal-metric-label">TOTAL PINGS</div>
            <div className="modal-metric-value" style={{ color: '#00ff41' }}>
              {totalPings || 0}
            </div>
          </div>
          <div className="modal-metric-box">
            <div className="modal-metric-label">SUCCESSFUL</div>
            <div className="modal-metric-value" style={{ color: '#39ff14' }}>
              {successfulPings || 0}
            </div>
          </div>
          <div className="modal-metric-box">
            <div className="modal-metric-label">FAILED</div>
            <div className="modal-metric-value" style={{ color: failedPings > 0 ? '#ff3131' : '#39ff14' }}>
              {failedPings}
            </div>
          </div>
        </div>

        {/* Recent Pings */}
        {recentPings && recentPings.length > 0 && (
          <div className="modal-section">
            <div className="modal-section-header">&gt; RECENT_PINGS</div>
            <div className="modal-pings-table">
              <div className="modal-ping-row modal-ping-header-row">
                <span>STATUS</span>
                <span>LATENCY</span>
                <span>TIME</span>
              </div>
              {recentPings.slice(0, 8).map((ping, i) => (
                <div key={i} className="modal-ping-row">
                  <span style={{ color: ping.isSuccess ? '#39ff14' : '#ff3131' }}>
                    {ping.statusCode || 'ERR'}
                  </span>
                  <span style={{
                    color: ping.latencyMs < 200 ? '#39ff14' : ping.latencyMs < 1000 ? '#ccff00' : '#ff3131'
                  }}>
                    {Math.round(ping.latencyMs)}ms
                  </span>
                  <span style={{ color: '#3a6b4a' }}>
                    {new Date(ping.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live API Response */}
        <div className="modal-section">
          <div className="modal-section-header">&gt; LIVE_RESPONSE</div>
          {loading ? (
            <div className="modal-loading">
              <span className="modal-loading-text">Fetching endpoint data<span className="blink-cursor">_</span></span>
            </div>
          ) : error ? (
            <div className="modal-error">[ERROR] {error}</div>
          ) : liveData ? (
            <div className="modal-response">
              {/* Response Status */}
              <div className="modal-response-status">
                <span style={{ color: liveData.isSuccess ? '#39ff14' : '#ff3131' }}>
                  {liveData.statusCode} {liveData.statusText}
                </span>
                <span style={{
                  color: liveData.latencyMs < 200 ? '#39ff14' : liveData.latencyMs < 1000 ? '#ccff00' : '#ff3131'
                }}>
                  {Math.round(liveData.latencyMs)}ms
                </span>
              </div>

              {/* Response Headers */}
              {liveData.responseHeaders && Object.keys(liveData.responseHeaders).length > 0 && (
                <div className="modal-response-headers">
                  <div className="modal-subsection-title"># HEADERS</div>
                  {Object.entries(liveData.responseHeaders).slice(0, 10).map(([key, val]) => (
                    <div key={key} className="modal-header-entry">
                      <span className="modal-header-key">{key}:</span>
                      <span className="modal-header-val">{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Response Body */}
              {liveData.bodyPreview && (
                <div className="modal-response-body">
                  <div className="modal-subsection-title"># BODY</div>
                  <pre className="modal-body-content">{liveData.bodyPreview}</pre>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
