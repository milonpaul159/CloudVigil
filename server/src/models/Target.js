/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — Target Model                                ║
 * ║  Stores API endpoints that are being monitored            ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const mongoose = require('mongoose');

const targetSchema = new mongoose.Schema(
  {
    /** The full URL to monitor (e.g., "https://api.example.com/health") */
    url: {
      type: String,
      required: [true, 'Target URL is required'],
      trim: true,
    },

    /** Human-readable label (e.g., "Payment Gateway") */
    name: {
      type: String,
      required: [true, 'Endpoint name is required'],
      trim: true,
    },

    /** Whether this target is actively being pinged */
    isActive: {
      type: Boolean,
      default: true,
    },

    /** Username of the user who added this target */
    createdBy: {
      type: String,
      default: 'admin',
    },
  },
  {
    timestamps: true, // Adds createdAt & updatedAt
  }
);

// ── Prevent duplicate URLs ────────────────────────────────────
targetSchema.index({ url: 1 }, { unique: true });

module.exports = mongoose.model('Target', targetSchema);
