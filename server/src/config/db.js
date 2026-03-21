/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — Database Connection Module                  ║
 * ║  Connects to MongoDB with retry logic and event logging   ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI from environment variables.
 * Retries up to 5 times with a 5-second delay between attempts.
 */
const connectDB = async () => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 5000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);

      // ── Connection event listeners ──────────────────────────
      mongoose.connection.on('error', (err) => {
        console.error(`❌ MongoDB connection error: ${err.message}`);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
      });

      return; // Success — exit the loop
    } catch (err) {
      console.error(
        `❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`
      );

      if (attempt === MAX_RETRIES) {
        console.error('💀 All MongoDB connection attempts exhausted. Exiting.');
        process.exit(1);
      }

      console.log(`⏳ Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

module.exports = connectDB;
