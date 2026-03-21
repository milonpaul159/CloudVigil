/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — JWT Verification Middleware                 ║
 * ║  Protects routes by validating Bearer tokens              ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const jwt = require('jsonwebtoken');

/**
 * Express middleware that verifies a JWT from the Authorization header.
 *
 * Expected header format:  Authorization: Bearer <token>
 *
 * On success:  Attaches decoded payload to `req.user` and calls next().
 * On failure:  Returns 401 or 403 with a descriptive JSON error.
 */
const verifyToken = (req, res, next) => {
  try {
    // ── 1. Extract the Authorization header ───────────────────
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No Authorization header provided.',
      });
    }

    // ── 2. Validate the Bearer scheme ─────────────────────────
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format. Expected: Bearer <token>',
      });
    }

    // ── 3. Extract the token string ───────────────────────────
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Token is missing after Bearer prefix.',
      });
    }

    // ── 4. Verify the token ───────────────────────────────────
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── 5. Attach user info to the request object ─────────────
    req.user = decoded;

    next();
  } catch (err) {
    // Handle specific JWT errors for better debugging
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired. Please log in again.',
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        error: 'Invalid token. Authentication failed.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication.',
    });
  }
};

module.exports = verifyToken;
