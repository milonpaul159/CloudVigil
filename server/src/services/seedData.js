/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — Seed Data                                   ║
 * ║  Seeds MongoDB with sample targets and ping history       ║
 * ║  so the analytics endpoint returns meaningful data        ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const Target = require('../models/Target');
const PingResult = require('../models/PingResult');

/**
 * Sample targets to seed into the database.
 * These simulate real-world endpoints with different behaviors.
 */
const SAMPLE_TARGETS = [
  {
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    name: 'JSONPlaceholder API',
    isActive: true,
    createdBy: 'admin',
  },
  {
    url: 'https://httpbin.org/status/200',
    name: 'Healthy Endpoint',
    isActive: true,
    createdBy: 'admin',
  },
  {
    url: 'https://httpbin.org/status/500',
    name: 'Failing Endpoint',
    isActive: true,
    createdBy: 'admin',
  },
];

/**
 * Generates mock ping results for the last 24 hours.
 * Creates 48 data points (one every 30 minutes) per target.
 *
 * @param {Object} target - The target document
 * @param {string} behavior - 'healthy', 'degraded', or 'failing'
 * @returns {Array} - Array of PingResult objects
 */
const generateMockHistory = (target, behavior) => {
  const results = [];
  const now = Date.now();
  const THIRTY_MINUTES = 30 * 60 * 1000;

  for (let i = 0; i < 48; i++) {
    const checkedAt = new Date(now - i * THIRTY_MINUTES);
    let data;

    switch (behavior) {
      case 'healthy':
        data = {
          statusCode: 200,
          latencyMs: Math.floor(Math.random() * 150) + 20, // 20-170ms
          isSuccess: true,
          errorMessage: null,
        };
        break;

      case 'degraded':
        // 70% healthy pings, 30% high-latency spikes
        if (Math.random() > 0.3) {
          data = {
            statusCode: 200,
            latencyMs: Math.floor(Math.random() * 200) + 50,
            isSuccess: true,
            errorMessage: null,
          };
        } else {
          data = {
            statusCode: 200,
            latencyMs: Math.floor(Math.random() * 3000) + 2000, // 2000-5000ms
            isSuccess: true,
            errorMessage: null,
          };
        }
        break;

      case 'failing':
        // 40% return 500, 30% return 503, 30% timeout
        const roll = Math.random();
        if (roll < 0.4) {
          data = {
            statusCode: 500,
            latencyMs: Math.floor(Math.random() * 500) + 100,
            isSuccess: false,
            errorMessage: 'HTTP 500: Internal Server Error',
          };
        } else if (roll < 0.7) {
          data = {
            statusCode: 503,
            latencyMs: Math.floor(Math.random() * 300) + 50,
            isSuccess: false,
            errorMessage: 'HTTP 503: Service Unavailable',
          };
        } else {
          data = {
            statusCode: 0,
            latencyMs: 10000,
            isSuccess: false,
            errorMessage: 'Timeout: No response within 10000ms',
          };
        }
        break;
    }

    results.push({
      targetId: target._id,
      url: target.url,
      name: target.name,
      ...data,
      checkedAt,
    });
  }

  return results;
};

/**
 * Seeds the database with sample targets and mock ping history.
 * Skips seeding if targets already exist.
 */
const seedDatabase = async () => {
  try {
    const existingTargets = await Target.countDocuments();

    if (existingTargets > 0) {
      console.log(`📦 Database already has ${existingTargets} target(s). Skipping seed.`);
      return;
    }

    console.log('🌱 Seeding database with sample data...');

    // ── Create targets ────────────────────────────────────────
    const targets = await Target.insertMany(SAMPLE_TARGETS);
    console.log(`   ✅ Created ${targets.length} sample targets`);

    // ── Generate and insert mock ping history ─────────────────
    const behaviors = ['healthy', 'degraded', 'failing'];
    let totalPings = 0;

    for (let i = 0; i < targets.length; i++) {
      const history = generateMockHistory(targets[i], behaviors[i]);
      await PingResult.insertMany(history);
      totalPings += history.length;
    }

    console.log(`   ✅ Created ${totalPings} mock ping results (24h history)`);
    console.log('🌱 Seeding complete!\n');
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  }
};

module.exports = seedDatabase;
