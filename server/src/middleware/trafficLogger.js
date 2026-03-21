/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — API Traffic Logger Middleware                ║
 * ║  Records every request to the ApiTraffic collection       ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const { performance } = require('perf_hooks');
const ApiTraffic = require('../models/ApiTraffic');

/**
 * Express middleware that logs each request to MongoDB.
 * Captures: method, path, status code, response time, user, IP.
 *
 * Hooks into res.end() to capture the final status code and timing.
 */
const trafficLogger = (req, res, next) => {
  const startTime = performance.now();

  // ── Hook into response finish to capture final data ─────────
  const originalEnd = res.end;
  res.end = function (...args) {
    const responseTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    // Save traffic entry asynchronously (fire-and-forget, no await)
    ApiTraffic.create({
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode: res.statusCode,
      responseTimeMs,
      user: req.user?.username || 'anonymous',
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || '',
      timestamp: new Date(),
    }).catch((err) => {
      // Silently fail — traffic logging should never crash the server
      console.error('⚠️  Traffic log error:', err.message);
    });

    originalEnd.apply(this, args);
  };

  next();
};

module.exports = trafficLogger;
