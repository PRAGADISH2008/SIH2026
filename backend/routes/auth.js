const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const errorResponse = require('../utils/errorResponse');
const { hashPassword, verifyPassword } = require('../utils/password');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── POST /auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, password, display_name, mobile_number } = req.body;

    if (!username || typeof username !== 'string' || !username.trim()) {
      return errorResponse(res, 400, 'Username is required');
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return errorResponse(res, 400, 'Username must be at least 3 characters long');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters long');
    }

    const cleanDisplayName = (display_name && typeof display_name === 'string')
      ? display_name.trim()
      : cleanUsername;

    const cleanMobile = (mobile_number && typeof mobile_number === 'string' && mobile_number.trim())
      ? mobile_number.trim()
      : null;

    // Check duplicate username
    const existing = await pool.query(
      'SELECT id FROM artisans WHERE LOWER(username) = $1',
      [cleanUsername]
    );

    if (existing.rows.length > 0) {
      return errorResponse(res, 409, 'Username already exists. Please choose a different username.');
    }

    // Hash password asynchronously with salt
    const hashedPassword = await hashPassword(password);
    const artisanId = uuidv4();

    await pool.query(
      `INSERT INTO artisans (id, username, password_hash, display_name, mobile_number)
       VALUES ($1, $2, $3, $4, $5)`,
      [artisanId, cleanUsername, hashedPassword, cleanDisplayName, cleanMobile]
    );

    // Sign JWT with exact contract: { artisan_id }
    const token = jwt.sign(
      { artisan_id: artisanId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      artisan: {
        artisan_id: artisanId,
        username: cleanUsername,
        display_name: cleanDisplayName,
        mobile_number: cleanMobile,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return errorResponse(res, 500, 'Failed to register artisan account');
  }
});

// ─── POST /auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorResponse(res, 400, 'Username and password are required');
    }

    const cleanUsername = String(username).trim().toLowerCase();

    // Look up artisan by username
    const result = await pool.query(
      'SELECT id, username, password_hash, display_name, mobile_number FROM artisans WHERE LOWER(username) = $1',
      [cleanUsername]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 401, 'Invalid username or password');
    }

    const artisan = result.rows[0];

    if (!artisan.password_hash) {
      return errorResponse(res, 401, 'Invalid username or password');
    }

    // Verify password securely with scrypt
    const isMatch = await verifyPassword(password, artisan.password_hash);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid username or password');
    }

    // Sign JWT with exact contract: { artisan_id }
    const token = jwt.sign(
      { artisan_id: artisan.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      artisan: {
        artisan_id: artisan.id,
        username: artisan.username,
        display_name: artisan.display_name || artisan.username,
        mobile_number: artisan.mobile_number || null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse(res, 500, 'Failed to process login');
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, display_name, mobile_number, created_at FROM artisans WHERE id = $1',
      [req.artisan_id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'Artisan not found');
    }

    const artisan = result.rows[0];
    res.status(200).json({
      artisan: {
        artisan_id: artisan.id,
        username: artisan.username || 'artisan',
        display_name: artisan.display_name || artisan.username || 'Artisan',
        mobile_number: artisan.mobile_number || null,
        created_at: artisan.created_at,
      },
    });
  } catch (err) {
    console.error('Fetch profile error:', err);
    return errorResponse(res, 500, 'Failed to fetch artisan profile');
  }
});

module.exports = router;
