/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — Traffic Analytics Routes                    ║
 * ║  GET /api/traffic — aggregated API traffic data           ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const express = require('express');
const ApiTraffic = require('../models/ApiTraffic');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.use(verifyToken);

/**
 * GET /api/traffic
 * Returns aggregated API traffic: requests per route, method breakdown,
 * top users, and recent request log.
 *
 * Query Params:
 *   - hours : look-back window (default: 24)
 */
router.get('/', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // ── Role-based filter: members only see their own traffic ──
    const isAdmin = req.user.role === 'admin';
    const baseFilter = { timestamp: { $gte: since } };
    if (!isAdmin) {
      baseFilter.user = req.user.username;
    }

    // ── 1. Total request count ────────────────────────────────
    const totalRequests = await ApiTraffic.countDocuments(baseFilter);

    // ── 2. Requests grouped by route (path) ───────────────────
    const byRoute = await ApiTraffic.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: { path: '$path', method: '$method' },
          count: { $sum: 1 },
          avgResponseMs: { $avg: '$responseTimeMs' },
          lastAccessed: { $max: '$timestamp' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    // ── 3. Method breakdown (GET, POST, etc.) ─────────────────
    const byMethod = await ApiTraffic.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // ── 4. Status code breakdown ──────────────────────────────
    const byStatus = await ApiTraffic.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$statusCode',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ── 5. Top users by request count ─────────────────────────
    const topUsers = await ApiTraffic.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
          lastActive: { $max: '$timestamp' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // ── 6. Requests over time (hourly buckets) ────────────────
    const overTime = await ApiTraffic.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%dT%H:00:00',
              date: '$timestamp',
            },
          },
          count: { $sum: 1 },
          avgResponseMs: { $avg: '$responseTimeMs' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ── 7. Recent requests (latest 30) ────────────────────────
    const recentRequests = await ApiTraffic.find(baseFilter)
      .sort({ timestamp: -1 })
      .limit(30)
      .select('method path statusCode responseTimeMs user timestamp');

    return res.status(200).json({
      success: true,
      period: `Last ${hours} hours`,
      generatedAt: new Date().toISOString(),
      traffic: {
        totalRequests,
        byRoute: byRoute.map((r) => ({
          method: r._id.method,
          path: r._id.path,
          count: r.count,
          avgResponseMs: Math.round(r.avgResponseMs * 100) / 100,
          lastAccessed: r.lastAccessed,
        })),
        byMethod: byMethod.map((m) => ({
          method: m._id,
          count: m.count,
        })),
        byStatus: byStatus.map((s) => ({
          statusCode: s._id,
          count: s.count,
        })),
        topUsers: topUsers.map((u) => ({
          username: u._id,
          requests: u.count,
          lastActive: u.lastActive,
        })),
        overTime: overTime.map((t) => ({
          time: t._id,
          requests: t.count,
          avgResponseMs: Math.round(t.avgResponseMs * 100) / 100,
        })),
        recentRequests,
      },
    });
  } catch (err) {
    console.error('❌ Traffic analytics error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while computing traffic analytics.',
    });
  }
});

module.exports = router;
