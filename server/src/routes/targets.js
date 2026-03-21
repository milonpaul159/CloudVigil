/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — Target Routes                               ║
 * ║  CRUD for API monitoring targets (JWT-protected)          ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const express = require('express');
const Target = require('../models/Target');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// ── All routes in this file require authentication ────────────
router.use(verifyToken);

/**
 * POST /api/targets
 * Add a new API URL to the monitoring list.
 *
 * Request Body:
 *   { "url": "https://api.example.com/health", "name": "Payment Gateway" }
 *
 * Success Response (201):
 *   {
 *     "success": true,
 *     "message": "Target added successfully",
 *     "target": { "_id": "...", "url": "...", "name": "...", ... }
 *   }
 */
router.post('/', async (req, res) => {
  try {
    const { url, name } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (!url || !name) {
      return res.status(400).json({
        success: false,
        error: 'Both "url" and "name" fields are required.',
      });
    }

    // ── Validate URL format ───────────────────────────────────
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format. Please provide a valid HTTP/HTTPS URL.',
      });
    }

    // ── Create the target in MongoDB ──────────────────────────
    const target = await Target.create({
      url,
      name,
      createdBy: req.user.username,
    });

    return res.status(201).json({
      success: true,
      message: 'Target added successfully',
      target,
    });
  } catch (err) {
    // Handle duplicate URL errors
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'This URL is already being monitored.',
      });
    }

    console.error('❌ Target creation error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while adding target.',
    });
  }
});

/**
 * GET /api/targets
 * Retrieve all monitored targets.
 *
 * Success Response (200):
 *   {
 *     "success": true,
 *     "count": 3,
 *     "targets": [ { "_id": "...", "url": "...", "name": "...", ... }, ... ]
 *   }
 */
router.get('/', async (req, res) => {
  try {
    const targets = await Target.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: targets.length,
      targets,
    });
  } catch (err) {
    console.error('❌ Target fetch error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching targets.',
    });
  }
});

/**
 * DELETE /api/targets/:id
 * Remove a target from the monitoring list.
 */
router.delete('/:id', async (req, res) => {
  try {
    const target = await Target.findByIdAndDelete(req.params.id);

    if (!target) {
      return res.status(404).json({
        success: false,
        error: 'Target not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Target removed successfully',
      target,
    });
  } catch (err) {
    console.error('❌ Target deletion error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while deleting target.',
    });
  }
});

module.exports = router;
