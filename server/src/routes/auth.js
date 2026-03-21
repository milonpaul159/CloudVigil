/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — Authentication Routes                       ║
 * ║  POST /api/auth/login    — returns a signed JWT           ║
 * ║  POST /api/auth/register — creates a new user account     ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

/**
 * POST /api/auth/register
 *
 * Request Body:
 *   { "username": "john", "password": "securePass123" }
 *
 * Success Response (201):
 *   { "success": true, "message": "Account created successfully", "user": {...} }
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // ── 1. Validate request body ──────────────────────────────
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters.',
      });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        success: false,
        error: 'Username must be between 3 and 30 characters.',
      });
    }

    // ── 2. Check if username already exists ────────────────────
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Username is already taken.',
      });
    }

    // ── 3. Create user (password hashed via pre-save hook) ────
    const user = await User.create({
      username,
      passwordHash: password, // The pre-save hook will bcrypt this
      role: 'member',
    });

    // ── 4. Auto-login: generate JWT for the new user ──────────
    const tokenPayload = {
      id: user._id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during registration.',
    });
  }
});

/**
 * POST /api/auth/login
 *
 * Request Body:
 *   { "username": "admin", "password": "mypassword" }
 *
 * Success Response (200):
 *   { "success": true, "message": "Authentication successful", "token": "...", "user": {...} }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // ── 1. Validate request body ──────────────────────────────
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required.',
      });
    }

    // ── 2. Find user by username ──────────────────────────────
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.',
      });
    }

    // ── 3. Verify password against bcrypt hash ────────────────
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.',
      });
    }

    // ── 4. Sign a JWT with user payload ───────────────────────
    const tokenPayload = {
      id: user._id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    // ── 5. Return the token ───────────────────────────────────
    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error('❌ Auth login error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication.',
    });
  }
});

module.exports = router;
