/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — Server Entrypoint                           ║
 * ║  Express server with JWT auth, MongoDB, CORS, and         ║
 * ║  scheduled pinger engine                                  ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

// ── Load environment variables FIRST ──────────────────────────
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

// ── Internal modules ──────────────────────────────────────────
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const targetRoutes = require('./routes/targets');
const analyticsRoutes = require('./routes/analytics');
const trafficRoutes = require('./routes/traffic');
const apiTestRoutes = require('./routes/apitest');
const { runPingCycle } = require('./services/pingerEngine');
const seedDatabase = require('./services/seedData');
const seedUsers = require('./services/seedUsers');
const trafficLogger = require('./middleware/trafficLogger');

// ══════════════════════════════════════════════════════════════
//  Initialize Express App
// ══════════════════════════════════════════════════════════════
const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
})); // Use CORS_ORIGIN in production, allow all in dev
app.use(express.json({ limit: '5mb' })); // Parse JSON, allow big spec files
app.use(express.urlencoded({ extended: true }));

// ── Traffic logging middleware ─────────────────────────────────
app.use(trafficLogger);

// ── Request logging (simple, for demo) ────────────────────────
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  next();
});

// ══════════════════════════════════════════════════════════════
//  Routes
// ══════════════════════════════════════════════════════════════
app.use('/api/auth', authRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/apitest', apiTestRoutes);

// ── Health check (no auth required) ───────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CloudVigil API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Manual ping trigger (for demo, protected) ─────────────────
const verifyToken = require('./middleware/verifyToken');
app.post('/api/pings/trigger', verifyToken, async (req, res) => {
  try {
    const results = await runPingCycle();
    res.status(200).json({
      success: true,
      message: `Ping cycle complete. ${results.length} endpoint(s) checked.`,
      results,
    });
  } catch (err) {
    console.error('❌ Manual ping trigger error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to run ping cycle.',
    });
  }
});

// ── Serve React client in production ──────────────────────────
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientBuildPath));

// SPA fallback — serve index.html for any non-API route
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ── 404 handler (API routes only) ─────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found.`,
  });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error.',
  });
});

// ══════════════════════════════════════════════════════════════
//  Start Server
// ══════════════════════════════════════════════════════════════
const startServer = async () => {
  try {
    // ── 1. Connect to MongoDB ─────────────────────────────────
    await connectDB();

    // ── 2. Seed initial users + sample data ───────────────────
    try {
      await seedUsers();
      await seedDatabase();
    } catch (seedErr) {
      console.warn('⚠️  Seeding skipped (DB may be unavailable):', seedErr.message);
    }
  } catch (dbErr) {
    console.warn('⚠️  Database setup failed:', dbErr.message);
    console.warn('   Server will start without database functionality.');
  }

  // ── 3. Start Express listener (always) ───────────────────
  app.listen(PORT, () => {
    console.log(`\n🚀 CloudVigil server running on http://localhost:${PORT}`);
    console.log(`   📊 Health check:  GET  /api/health`);
    console.log(`   🔐 Login:         POST /api/auth/login`);
    console.log(`   📝 Register:      POST /api/auth/register`);
    console.log(`   🎯 Targets:       POST /api/targets`);
    console.log(`   📈 Analytics:     GET  /api/analytics`);
    console.log(`   🚦 Traffic:       GET  /api/traffic`);
    console.log(`   🔄 Manual ping:   POST /api/pings/trigger\n`);
  });

  // ── 4. Schedule the pinger engine ─────────────────────────
  const cronExpression = process.env.PING_CRON || '*/30 * * * * *';
  cron.schedule(cronExpression, async () => {
    console.log(`⏰ [${new Date().toISOString()}] Scheduled ping cycle starting...`);
    try {
      await runPingCycle();
    } catch (err) {
      console.error('❌ Scheduled ping cycle error:', err.message);
    }
  });

  console.log(`⏰ Pinger scheduled with cron: "${cronExpression}"`);
};

startServer();
