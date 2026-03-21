/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — Pinger Engine                               ║
 * ║  Core service that pings all active targets and records   ║
 * ║  latency, status codes, and errors to MongoDB             ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const axios = require('axios');
const { performance } = require('perf_hooks');
const Target = require('../models/Target');
const PingResult = require('../models/PingResult');

/**
 * Pings a single URL and measures the response latency.
 *
 * Uses performance.now() for high-resolution timing.
 * Handles timeouts and network errors gracefully without throwing.
 *
 * @param {string} url - The URL to ping
 * @param {number} timeoutMs - Request timeout in milliseconds
 * @returns {Object} - { statusCode, latencyMs, isSuccess, errorMessage }
 */
const pingSingleUrl = async (url, timeoutMs) => {
  const startTime = performance.now();

  try {
    const response = await axios.get(url, {
      timeout: timeoutMs,
      // Don't throw on non-2xx status codes so we can capture them
      validateStatus: () => true,
    });

    const endTime = performance.now();
    const latencyMs = Math.round((endTime - startTime) * 100) / 100;
    const statusCode = response.status;
    const isSuccess = statusCode >= 200 && statusCode < 300;

    return {
      statusCode,
      latencyMs,
      isSuccess,
      errorMessage: isSuccess ? null : `HTTP ${statusCode}: ${response.statusText}`,
    };
  } catch (err) {
    const endTime = performance.now();
    const latencyMs = Math.round((endTime - startTime) * 100) / 100;

    // ── Categorize the error ──────────────────────────────────
    let errorMessage = err.message;

    if (err.code === 'ECONNABORTED') {
      errorMessage = `Timeout: No response within ${timeoutMs}ms`;
    } else if (err.code === 'ENOTFOUND') {
      errorMessage = `DNS Error: Host not found for ${url}`;
    } else if (err.code === 'ECONNREFUSED') {
      errorMessage = `Connection Refused: ${url}`;
    } else if (err.code === 'ECONNRESET') {
      errorMessage = `Connection Reset: ${url}`;
    }

    return {
      statusCode: 0,
      latencyMs,
      isSuccess: false,
      errorMessage,
    };
  }
};

/**
 * Runs a full ping cycle across all active targets in the database.
 *
 * Flow:
 *   1. Fetch all active targets from MongoDB
 *   2. Ping each target concurrently
 *   3. Save results to the PingResult collection
 *   4. Return a summary array
 *
 * @returns {Array} - Array of saved PingResult documents
 */
const runPingCycle = async () => {
  const timeoutMs = parseInt(process.env.AXIOS_TIMEOUT_MS) || 10000;

  // ── 1. Fetch active targets ─────────────────────────────────
  const targets = await Target.find({ isActive: true });

  if (targets.length === 0) {
    console.log('⚠️  No active targets to ping. Add targets via POST /api/targets.');
    return [];
  }

  console.log(`\n🔍 Pinging ${targets.length} target(s)...`);

  // ── 2. Ping all targets concurrently ────────────────────────
  const results = await Promise.all(
    targets.map(async (target) => {
      const pingData = await pingSingleUrl(target.url, timeoutMs);

      // ── 3. Save result to MongoDB ─────────────────────────────
      const savedResult = await PingResult.create({
        targetId: target._id,
        url: target.url,
        name: target.name,
        statusCode: pingData.statusCode,
        latencyMs: pingData.latencyMs,
        isSuccess: pingData.isSuccess,
        errorMessage: pingData.errorMessage,
        checkedAt: new Date(),
      });

      // ── Log individual result ─────────────────────────────────
      const icon = pingData.isSuccess ? '✅' : '❌';
      console.log(
        `  ${icon} ${target.name} → ${pingData.statusCode || 'ERR'} | ${pingData.latencyMs}ms` +
          (pingData.errorMessage ? ` | ${pingData.errorMessage}` : '')
      );

      return savedResult;
    })
  );

  console.log(`📊 Ping cycle complete. ${results.length} result(s) saved.\n`);
  return results;
};

module.exports = { pingSingleUrl, runPingCycle };
