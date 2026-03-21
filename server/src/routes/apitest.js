/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — API Test Routes                             ║
 * ║  POST /api/apitest/url  — test a single URL               ║
 * ║  POST /api/apitest/spec — parse & test OpenAPI spec       ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const Target = require('../models/Target');
const { testEndpoint, parseOpenApiSpec } = require('../services/apiTester');

const router = express.Router();

router.use(verifyToken);

/**
 * POST /api/apitest/url
 *
 * Request Body:
 *   { "url": "https://api.example.com/health", "method": "GET" }
 *
 * Tests a single URL and returns detailed result.
 */
router.post('/url', async (req, res) => {
  try {
    const { url, method = 'GET', headers = {}, body = null } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required.',
      });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format.',
      });
    }

    const result = await testEndpoint({ url, method, headers, body });

    // Auto-add to monitoring targets (skip if already exists)
    try {
      const parsed = new URL(url);
      const name = parsed.hostname.replace('www.', '').split('.')[0];
      const displayName = `${name.charAt(0).toUpperCase() + name.slice(1)} (Tested)`;
      const exists = await Target.findOne({ url });
      if (!exists) {
        await Target.create({
          url,
          name: displayName,
          isActive: true,
          createdBy: req.user.username,
        });
        console.log(`   🎯 Auto-added target: ${displayName}`);
      }
    } catch (addErr) {
      // Silently skip — duplicate URL or validation error
    }

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (err) {
    console.error('❌ API test error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to test the endpoint.',
    });
  }
});

/**
 * POST /api/apitest/spec
 *
 * Request Body:
 *   { "spec": { ... OpenAPI/Swagger JSON ... } }
 *
 * Parses the spec, extracts endpoints, tests each one, returns results.
 */
router.post('/spec', async (req, res) => {
  try {
    const { spec } = req.body;

    if (!spec || typeof spec !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'A valid OpenAPI/Swagger JSON spec object is required.',
      });
    }

    // Parse the spec to extract endpoints
    const endpoints = parseOpenApiSpec(spec);

    if (endpoints.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No testable endpoints found in the spec. Ensure it has valid paths.',
      });
    }

    // Test all endpoints concurrently (max 10 at a time to avoid overwhelming)
    const batchSize = 10;
    const results = [];

    for (let i = 0; i < endpoints.length; i += batchSize) {
      const batch = endpoints.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((ep) =>
          testEndpoint({
            url: ep.url,
            method: ep.method,
          }).then((result) => ({
            ...result,
            name: ep.name,
            path: ep.path,
          }))
        )
      );
      results.push(...batchResults);
    }

    const successCount = results.filter((r) => r.isSuccess).length;

    // Auto-add all tested endpoints as monitoring targets
    for (const r of results) {
      try {
        const exists = await Target.findOne({ url: r.url });
        if (!exists && r.url.startsWith('http')) {
          const parsed = new URL(r.url);
          const host = parsed.hostname.replace('www.', '').split('.')[0];
          const displayName = r.name || `${host.charAt(0).toUpperCase() + host.slice(1)} ${r.path}`;
          await Target.create({
            url: r.url,
            name: displayName.substring(0, 60),
            isActive: true,
            createdBy: req.user.username,
          });
          console.log(`   🎯 Auto-added target: ${displayName}`);
        }
      } catch (addErr) {
        // Silently skip duplicates
      }
    }

    return res.status(200).json({
      success: true,
      specTitle: spec.info?.title || 'Unknown API',
      specVersion: spec.info?.version || 'N/A',
      totalEndpoints: results.length,
      successfulEndpoints: successCount,
      failedEndpoints: results.length - successCount,
      results,
    });
  } catch (err) {
    console.error('❌ Spec test error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to parse and test the spec.',
    });
  }
});

module.exports = router;
