/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — Analytics Routes                            ║
 * ║  GET /api/analytics — aggregated monitoring data          ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const express = require('express');
const PingResult = require('../models/PingResult');
const Target = require('../models/Target');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// ── All analytics routes require authentication ───────────────
router.use(verifyToken);

/**
 * GET /api/analytics
 * Returns per-endpoint analytics: uptime %, avg latency, latest status.
 *
 * Query Params (optional):
 *   - hours : number of hours to look back (default: 24)
 *
 * Success Response (200):
 *   {
 *     "success": true,
 *     "period": "Last 24 hours",
 *     "analytics": [
 *       {
 *         "name": "Payment Gateway",
 *         "url": "https://...",
 *         "totalPings": 48,
 *         "successfulPings": 46,
 *         "uptimePercent": 95.83,
 *         "avgLatencyMs": 142.5,
 *         "maxLatencyMs": 4023,
 *         "minLatencyMs": 12,
 *         "latestStatus": { "statusCode": 200, "latencyMs": 45, "isSuccess": true, "checkedAt": "..." },
 *         "recentHistory": [ ... last 20 pings ... ]
 *       }
 *     ]
 *   }
 */
router.get('/', async (req, res) => {
  try {
    // ── 1. Determine the time window ──────────────────────────
    const hours = parseInt(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // ── 2. Get all active targets ─────────────────────────────
    const targets = await Target.find({ isActive: true });

    if (targets.length === 0) {
      return res.status(200).json({
        success: true,
        period: `Last ${hours} hours`,
        message: 'No targets are being monitored. Add targets via POST /api/targets.',
        analytics: [],
      });
    }

    // ── 3. Build analytics for each target ────────────────────
    const analytics = await Promise.all(
      targets.map(async (target) => {
        // Fetch all pings for this target in the time window
        const pings = await PingResult.find({
          targetId: target._id,
          checkedAt: { $gte: since },
        }).sort({ checkedAt: -1 });

        const totalPings = pings.length;
        const successfulPings = pings.filter((p) => p.isSuccess).length;

        // Calculate aggregate metrics
        const latencies = pings.map((p) => p.latencyMs).filter((l) => l > 0);
        const avgLatencyMs =
          latencies.length > 0
            ? Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 100) / 100
            : 0;
        const maxLatencyMs = latencies.length > 0 ? Math.max(...latencies) : 0;
        const minLatencyMs = latencies.length > 0 ? Math.min(...latencies) : 0;

        return {
          name: target.name,
          url: target.url,
          isActive: target.isActive,
          totalPings,
          successfulPings,
          uptimePercent:
            totalPings > 0
              ? Math.round((successfulPings / totalPings) * 10000) / 100
              : 0,
          avgLatencyMs,
          maxLatencyMs,
          minLatencyMs,
          latestStatus: pings[0]
            ? {
                statusCode: pings[0].statusCode,
                latencyMs: pings[0].latencyMs,
                isSuccess: pings[0].isSuccess,
                errorMessage: pings[0].errorMessage,
                checkedAt: pings[0].checkedAt,
              }
            : null,
          // Last 20 pings for charting
          recentHistory: pings.slice(0, 20).map((p) => ({
            statusCode: p.statusCode,
            latencyMs: p.latencyMs,
            isSuccess: p.isSuccess,
            checkedAt: p.checkedAt,
          })),
        };
      })
    );

    return res.status(200).json({
      success: true,
      period: `Last ${hours} hours`,
      generatedAt: new Date().toISOString(),
      analytics,
    });
  } catch (err) {
    console.error('❌ Analytics fetch error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while computing analytics.',
    });
  }
});

/**
 * GET /api/analytics/history/:targetId
 * Returns the full ping history for a specific target.
 *
 * Query Params:
 *   - limit : max results (default: 50)
 */
router.get('/history/:targetId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const pings = await PingResult.find({ targetId: req.params.targetId })
      .sort({ checkedAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: pings.length,
      history: pings,
    });
  } catch (err) {
    console.error('❌ History fetch error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching history.',
    });
  }
});

module.exports = router;
