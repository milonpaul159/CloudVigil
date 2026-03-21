/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — ApiTraffic Model                            ║
 * ║  Logs every API request for traffic analytics             ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const mongoose = require('mongoose');

const apiTrafficSchema = new mongoose.Schema(
  {
    /** HTTP method (GET, POST, PUT, DELETE, etc.) */
    method: {
      type: String,
      required: true,
      uppercase: true,
    },

    /** The route path (e.g., "/api/analytics") */
    path: {
      type: String,
      required: true,
    },

    /** HTTP status code of the response */
    statusCode: {
      type: Number,
      default: 0,
    },

    /** Response time in milliseconds */
    responseTimeMs: {
      type: Number,
      default: 0,
    },

    /** Username of the authenticated user (or "anonymous") */
    user: {
      type: String,
      default: 'anonymous',
    },

    /** Client IP address */
    ip: {
      type: String,
      default: 'unknown',
    },

    /** User-Agent header */
    userAgent: {
      type: String,
      default: '',
    },

    /** Timestamp of the request */
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // We use our own 'timestamp' field
  }
);

// ── Indexes for fast dashboard queries ────────────────────────
apiTrafficSchema.index({ path: 1, timestamp: -1 });
apiTrafficSchema.index({ method: 1, timestamp: -1 });

module.exports = mongoose.model('ApiTraffic', apiTrafficSchema);
