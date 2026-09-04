const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const errorResponse = require('../utils/errorResponse');
const { hashPassword, verifyPassword } = require('../utils/password');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── POST /auth/register (Artisan Registration) ───────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, password, display_name, mobile_number, region } = req.body;

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

    const cleanRegion = (region && typeof region === 'string' && region.trim())
      ? region.trim()
      : null;

    // Check duplicate username in artisans
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
      `INSERT INTO artisans (id, username, password_hash, display_name, mobile_number, region)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [artisanId, cleanUsername, hashedPassword, cleanDisplayName, cleanMobile, cleanRegion]
    );

    // Sign JWT with explicit role and backward-compatible artisan_id
    const token = jwt.sign(
      { artisan_id: artisanId, role: 'artisan' },
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
        region: cleanRegion,
        role: 'artisan',
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return errorResponse(res, 500, 'Failed to register artisan account');
  }
});

// ─── POST /auth/login (Artisan Login) ─────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorResponse(res, 400, 'Username and password are required');
    }

    const cleanUsername = String(username).trim().toLowerCase();

    // Look up artisan by username, display name, or mobile number
    const result = await pool.query(
      `SELECT id, username, password_hash, display_name, mobile_number, region 
       FROM artisans 
       WHERE LOWER(username) = $1 
          OR LOWER(display_name) = $1
          OR mobile_number = $1
          OR mobile_number = '+91' || $1
          OR (mobile_number LIKE '%' || $1 AND length($1) >= 10)
       ORDER BY (password_hash IS NOT NULL) DESC
       LIMIT 1`,
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

    // Sign JWT with explicit role and backward-compatible artisan_id
    const token = jwt.sign(
      { artisan_id: artisan.id, role: 'artisan' },
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
        region: artisan.region || null,
        role: 'artisan',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse(res, 500, 'Failed to process login');
  }
});

// ─── POST /auth/user/register (Buyer/User Registration) ───────────────────
router.post('/user/register', async (req, res) => {
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

    // Check duplicate username in users table
    const existing = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = $1',
      [cleanUsername]
    );

    if (existing.rows.length > 0) {
      return errorResponse(res, 409, 'Username already exists. Please choose a different username.');
    }

    const hashedPassword = await hashPassword(password);
    const userId = uuidv4();

    await pool.query(
      `INSERT INTO users (id, username, password_hash, display_name, mobile_number, role)
       VALUES ($1, $2, $3, $4, $5, 'buyer')`,
      [userId, cleanUsername, hashedPassword, cleanDisplayName, cleanMobile]
    );

    // Sign JWT with explicit buyer role
    const token = jwt.sign(
      { user_id: userId, role: 'buyer' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Buyer registration successful',
      token,
      user: {
        id: userId,
        username: cleanUsername,
        display_name: cleanDisplayName,
        mobile_number: cleanMobile,
        region: null,
        role: 'buyer',
      },
    });
  } catch (err) {
    console.error('Buyer registration error:', err);
    return errorResponse(res, 500, 'Failed to register buyer account');
  }
});

// ─── POST /auth/user/login (Buyer/User Login) ─────────────────────────────
router.post('/user/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorResponse(res, 400, 'Username and password are required');
    }

    const cleanUsername = String(username).trim().toLowerCase();

    // Look up buyer in users table
    const result = await pool.query(
      'SELECT id, username, password_hash, display_name, mobile_number, role FROM users WHERE LOWER(username) = $1',
      [cleanUsername]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 401, 'Invalid username or password');
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      return errorResponse(res, 401, 'Invalid username or password');
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid username or password');
    }

    const token = jwt.sign(
      { user_id: user.id, role: 'buyer' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name || user.username,
        mobile_number: user.mobile_number || null,
        region: null,
        role: 'buyer',
      },
    });
  } catch (err) {
    console.error('Buyer login error:', err);
    return errorResponse(res, 500, 'Failed to process login');
  }
});

// ─── GET /auth/me (Consistent role-based profile resolution) ───────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (req.role === 'buyer') {
      const result = await pool.query(
        'SELECT id, username, display_name, mobile_number, role, created_at FROM users WHERE id = $1',
        [req.user_id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 404, 'User not found');
      }

      const user = result.rows[0];
      return res.status(200).json({
        id: user.id,
        username: user.username,
        display_name: user.display_name || user.username || 'Buyer',
        mobile_number: user.mobile_number || null,
        region: null,
        role: 'buyer',
        created_at: user.created_at,
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name || user.username || 'Buyer',
          mobile_number: user.mobile_number || null,
          region: null,
          role: 'buyer',
        },
      });
    }

    // Default: Artisan
    const result = await pool.query(
      'SELECT id, username, display_name, mobile_number, region, created_at FROM artisans WHERE id = $1',
      [req.artisan_id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'Artisan not found');
    }

    const artisan = result.rows[0];
    res.status(200).json({
      id: artisan.id,
      artisan_id: artisan.id,
      username: artisan.username || 'artisan',
      display_name: artisan.display_name || artisan.username || 'Master Artisan',
      mobile_number: artisan.mobile_number || null,
      region: artisan.region || null,
      role: 'artisan',
      created_at: artisan.created_at,
      artisan: {
        artisan_id: artisan.id,
        username: artisan.username || 'artisan',
        display_name: artisan.display_name || artisan.username || 'Master Artisan',
        mobile_number: artisan.mobile_number || null,
        region: artisan.region || null,
        role: 'artisan',
        created_at: artisan.created_at,
      },
    });
  } catch (err) {
    console.error('Fetch profile error:', err);
    return errorResponse(res, 500, 'Failed to fetch profile');
  }
});

module.exports = router;
