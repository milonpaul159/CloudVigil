import { useState, useRef } from 'react';
import { testUrl, testSpec } from '../services/api';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];

const METHOD_COLORS = {
  GET: '#38bdf8',
  POST: '#34d399',
  PUT: '#fbbf24',
  DELETE: '#f87171',
  PATCH: '#a78bfa',
  HEAD: '#64748b',
  OPTIONS: '#64748b',
};

/**
 * ApiTester — Tabbed panel: "Test URL" and "Import Spec"
 */
export default function ApiTester() {
  const [activeTab, setActiveTab] = useState('url');

  return (
    <div className="api-tester-section">
      <h3 className="section-title">🧪 API Tester</h3>

      <div className="glass-card tester-card">
        {/* Tab Switcher */}
        <div className="tester-tabs">
          <button
            className={`tester-tab ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => setActiveTab('url')}
          >
            🔗 Test URL
          </button>
          <button
            className={`tester-tab ${activeTab === 'spec' ? 'active' : ''}`}
            onClick={() => setActiveTab('spec')}
          >
            📄 Import API Docs (JSON)
          </button>
        </div>

        {activeTab === 'url' ? <UrlTester /> : <SpecTester />}
      </div>
    </div>
  );
}

/**
 * UrlTester — Test a single URL with method selection.
 */
function UrlTester() {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleTest = async (e) => {
    e.preventDefault();
    if (!url) return;
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const data = await testUrl(url, method);
      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tester-body">
      <form className="url-test-form" onSubmit={handleTest}>
        <select
          className="method-select"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          style={{ color: METHOD_COLORS[method] }}
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <input
          className="url-input"
          type="text"
          placeholder="https://api.example.com/health"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />

        <button
          type="submit"
          className="test-btn"
          disabled={loading || !url}
        >
          {loading ? '⏳ Testing...' : '▶ Test'}
        </button>
      </form>

      {error && <div className="login-error" style={{ marginTop: '1rem' }}>{error}</div>}

      {result && <ResultCard result={result} />}
    </div>
  );
}

/**
 * SpecTester — Upload or paste an OpenAPI/Swagger JSON spec.
 */
function SpecTester() {
  const [specText, setSpecText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [specInfo, setSpecInfo] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setSpecText(ev.target.result);
    };
    reader.readAsText(file);
  };

  const handleTest = async () => {
    if (!specText.trim()) return;
    setError('');
    setResults(null);
    setSpecInfo(null);
    setLoading(true);

    try {
      const spec = JSON.parse(specText);
      const data = await testSpec(spec);
      setSpecInfo({
        title: data.specTitle,
        version: data.specVersion,
        total: data.totalEndpoints,
        success: data.successfulEndpoints,
        failed: data.failedEndpoints,
      });
      setResults(data.results);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON. Please paste a valid OpenAPI/Swagger spec.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    setSpecText(JSON.stringify(SAMPLE_SPEC, null, 2));
  };

  return (
    <div className="tester-body">
      <div className="spec-actions">
        <button
          type="button"
          className="spec-action-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          📁 Upload JSON File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button type="button" className="spec-action-btn" onClick={handleLoadSample}>
          📋 Load Sample Spec
        </button>
        <button
          type="button"
          className="test-btn"
          onClick={handleTest}
          disabled={loading || !specText.trim()}
        >
          {loading ? '⏳ Testing All...' : '▶ Parse & Test All'}
        </button>
      </div>

      <textarea
        className="spec-textarea"
        placeholder='Paste your OpenAPI 3.x or Swagger 2.x JSON spec here, or upload a .json file...'
        value={specText}
        onChange={(e) => setSpecText(e.target.value)}
        rows={8}
      />

      {error && <div className="login-error" style={{ marginTop: '1rem' }}>{error}</div>}

      {specInfo && (
        <div className="spec-summary">
          <div className="glass-card summary-item" style={{ padding: '0.8rem 1rem' }}>
            <div className="summary-label">API</div>
            <div className="summary-value blue" style={{ fontSize: '1rem' }}>{specInfo.title}</div>
          </div>
          <div className="glass-card summary-item" style={{ padding: '0.8rem 1rem' }}>
            <div className="summary-label">Endpoints</div>
            <div className="summary-value blue" style={{ fontSize: '1.2rem' }}>{specInfo.total}</div>
          </div>
          <div className="glass-card summary-item" style={{ padding: '0.8rem 1rem' }}>
            <div className="summary-label">Passed</div>
            <div className="summary-value green" style={{ fontSize: '1.2rem' }}>{specInfo.success}</div>
          </div>
          <div className="glass-card summary-item" style={{ padding: '0.8rem 1rem' }}>
            <div className="summary-label">Failed</div>
            <div className="summary-value red" style={{ fontSize: '1.2rem' }}>{specInfo.failed}</div>
          </div>
        </div>
      )}

      {results && results.length > 0 && (
        <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '1rem' }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Name</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>
                    <span
                      className="method-badge"
                      style={{
                        color: METHOD_COLORS[r.method] || '#94a3b8',
                        background: `${METHOD_COLORS[r.method] || '#94a3b8'}15`,
                        border: `1px solid ${METHOD_COLORS[r.method] || '#94a3b8'}30`,
                      }}
                    >
                      {r.method}
                    </span>
                  </td>
                  <td className="url-cell" title={r.path}>{r.path}</td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{r.name}</td>
                  <td>
                    <span className={`status-code ${r.isSuccess ? 'success' : 'error'}`}>
                      {r.statusCode || 'ERR'}
                    </span>
                  </td>
                  <td className={`latency-cell ${r.latencyMs < 200 ? 'fast' : r.latencyMs < 1000 ? 'medium' : 'slow'}`}>
                    {Math.round(r.latencyMs)}ms
                  </td>
                  <td className="error-cell" title={r.errorMessage || ''}>{r.errorMessage || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * ResultCard — Displays detailed result from a single URL test.
 */
function ResultCard({ result }) {
  const statusColor = result.isSuccess ? 'var(--accent-green)' : 'var(--accent-red)';

  return (
    <div className="result-card glass-card" style={{ marginTop: '1rem', borderColor: `${statusColor}30` }}>
      <div className="result-header">
        <span
          className="method-badge"
          style={{
            color: METHOD_COLORS[result.method],
            background: `${METHOD_COLORS[result.method]}15`,
            border: `1px solid ${METHOD_COLORS[result.method]}30`,
            fontSize: '0.8rem',
            padding: '0.3rem 0.6rem',
          }}
        >
          {result.method}
        </span>
        <span className={`status-code ${result.isSuccess ? 'success' : 'error'}`} style={{ fontSize: '1rem', padding: '0.3rem 0.8rem' }}>
          {result.statusCode || 'ERR'} {result.statusText}
        </span>
        <span className="latency-cell" style={{ fontSize: '0.9rem', fontWeight: 600, color: result.latencyMs < 200 ? 'var(--accent-green)' : result.latencyMs < 1000 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
          {Math.round(result.latencyMs)}ms
        </span>
      </div>

      {result.errorMessage && (
        <div className="login-error" style={{ marginTop: '0.75rem' }}>{result.errorMessage}</div>
      )}

      {Object.keys(result.responseHeaders).length > 0 && (
        <div className="result-headers">
          <div className="result-section-title">Response Headers</div>
          {Object.entries(result.responseHeaders).map(([key, val]) => (
            <div key={key} className="header-row">
              <span className="header-key">{key}</span>
              <span className="header-val">{val}</span>
            </div>
          ))}
        </div>
      )}

      {result.bodyPreview && (
        <div className="result-body">
          <div className="result-section-title">Response Body</div>
          <pre className="body-preview">{result.bodyPreview}</pre>
        </div>
      )}
    </div>
  );
}

/**
 * Sample OpenAPI spec for demo purposes.
 */
const SAMPLE_SPEC = {
  openapi: '3.0.0',
  info: { title: 'JSONPlaceholder API', version: '1.0' },
  servers: [{ url: 'https://jsonplaceholder.typicode.com' }],
  paths: {
    '/posts': {
      get: { summary: 'List All Posts', operationId: 'getPosts' },
    },
    '/posts/1': {
      get: { summary: 'Get Post by ID', operationId: 'getPost' },
    },
    '/users': {
      get: { summary: 'List All Users', operationId: 'getUsers' },
    },
    '/comments': {
      get: { summary: 'List All Comments', operationId: 'getComments' },
    },
    '/todos/1': {
      get: { summary: 'Get Todo', operationId: 'getTodo' },
    },
  },
};
