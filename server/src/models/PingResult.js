/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — PingResult Model                            ║
 * ║  Stores individual ping check results for each endpoint   ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const mongoose = require('mongoose');

const pingResultSchema = new mongoose.Schema(
  {
    /** Reference to the Target document */
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Target',
      required: true,
    },

    /** The URL that was pinged (denormalized for fast queries) */
    url: {
      type: String,
      required: true,
      trim: true,
    },

    /** Human-readable endpoint name (denormalized) */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    /** HTTP status code returned (0 if the request failed entirely) */
    statusCode: {
      type: Number,
      default: 0,
    },

    /** Round-trip latency in milliseconds */
    latencyMs: {
      type: Number,
      default: 0,
    },

    /** Whether the ping was considered successful (2xx status) */
    isSuccess: {
      type: Boolean,
      default: false,
    },

    /** Error description if the ping failed */
    errorMessage: {
      type: String,
      default: null,
    },

    /** Timestamp when the ping was performed */
    checkedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Compound index for per-url time-series queries ────────────
pingResultSchema.index({ url: 1, checkedAt: -1 });
pingResultSchema.index({ targetId: 1, checkedAt: -1 });

module.exports = mongoose.model('PingResult', pingResultSchema);
