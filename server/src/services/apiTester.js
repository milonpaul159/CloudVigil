/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — API Tester Service                          ║
 * ║  Tests single endpoints and parses OpenAPI/Swagger specs  ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

/**
 * Test a single endpoint with configurable method, headers, and body.
 *
 * @param {Object} opts
 * @param {string} opts.url      - Full URL to test
 * @param {string} opts.method   - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {Object} opts.headers  - Optional request headers
 * @param {*}      opts.body     - Optional request body (for POST/PUT/PATCH)
 * @param {number} opts.timeout  - Timeout in ms (default: 10000)
 * @returns {Object} Test result
 */
const testEndpoint = async ({ url, method = 'GET', headers = {}, body = null, timeout = 10000 }) => {
  const startTime = performance.now();

  try {
    const config = {
      url,
      method: method.toUpperCase(),
      timeout,
      headers: {
        'User-Agent': 'CloudVigil-Tester/1.0',
        ...headers,
      },
      validateStatus: () => true, // Don't throw on any status code
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      config.data = body;
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }

    const response = await axios(config);
    const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;
    const statusCode = response.status;
    const isSuccess = statusCode >= 200 && statusCode < 400;

    // Truncate body preview to avoid huge payloads
    let bodyPreview = '';
    try {
      const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
      bodyPreview = data.length > 500 ? data.substring(0, 500) + '\n... (truncated)' : data;
    } catch {
      bodyPreview = '[Unable to parse response body]';
    }

    // Extract interesting response headers
    const responseHeaders = {};
    const interestingHeaders = ['content-type', 'server', 'x-powered-by', 'content-length', 'cache-control', 'x-request-id'];
    interestingHeaders.forEach((h) => {
      if (response.headers[h]) responseHeaders[h] = response.headers[h];
    });

    return {
      url,
      method: method.toUpperCase(),
      statusCode,
      statusText: response.statusText,
      latencyMs,
      isSuccess,
      bodyPreview,
      responseHeaders,
      errorMessage: null,
    };
  } catch (err) {
    const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;

    let errorMessage = err.message;
    if (err.code === 'ECONNABORTED') errorMessage = `Timeout after ${timeout}ms`;
    else if (err.code === 'ENOTFOUND') errorMessage = `DNS Error: Host not found`;
    else if (err.code === 'ECONNREFUSED') errorMessage = `Connection Refused`;
    else if (err.code === 'ECONNRESET') errorMessage = `Connection Reset`;

    return {
      url,
      method: method.toUpperCase(),
      statusCode: 0,
      statusText: 'ERROR',
      latencyMs,
      isSuccess: false,
      bodyPreview: '',
      responseHeaders: {},
      errorMessage,
    };
  }
};

/**
 * Parse an OpenAPI 3.x or Swagger 2.x JSON spec and extract testable endpoints.
 *
 * @param {Object} spec - Parsed JSON spec
 * @returns {Array} - Array of { method, url, path, name }
 */
const parseOpenApiSpec = (spec) => {
  const endpoints = [];

  // Determine base URL
  let baseUrl = '';

  // OpenAPI 3.x
  if (spec.openapi && spec.servers && spec.servers.length > 0) {
    baseUrl = spec.servers[0].url.replace(/\/$/, '');
  }
  // Swagger 2.x
  else if (spec.swagger && spec.host) {
    const scheme = (spec.schemes && spec.schemes[0]) || 'https';
    const basePath = (spec.basePath || '').replace(/\/$/, '');
    baseUrl = `${scheme}://${spec.host}${basePath}`;
  }

  if (!spec.paths) return endpoints;

  const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];

  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      if (methods[method]) {
        const operation = methods[method];
        const name = operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`;

        // Replace path parameters with sample values
        const resolvedPath = path
          .replace(/\{(\w+)\}/g, (_, param) => `{${param}}`)
          .replace(/\{id\}/gi, '1')
          .replace(/\{(\w+)Id\}/gi, '1')
          .replace(/\{(\w+)\}/g, 'sample');

        endpoints.push({
          method: method.toUpperCase(),
          path: resolvedPath,
          url: baseUrl ? `${baseUrl}${resolvedPath}` : resolvedPath,
          name: name.substring(0, 80),
        });
      }
    }
  }

  return endpoints;
};

module.exports = { testEndpoint, parseOpenApiSpec };
