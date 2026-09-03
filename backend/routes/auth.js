const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const errorResponse = require('../utils/errorResponse');

const router = express.Router();

/**
 * Generate a random 6-digit OTP.
 */
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Send OTP via Twilio if credentials are configured,
 * otherwise fall back to console.log.
 */
async function sendOTP(mobileNumber, otpCode) {
  const accountSid = process.env.SMS_PROVIDER_SID;
  const authToken = process.env.SMS_PROVIDER_AUTH_TOKEN;
  const fromNumber = process.env.SMS_PROVIDER_FROM_NUMBER;

  if (accountSid && authToken && fromNumber) {
    try {
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);

      const message = await client.messages.create({
        body: `Your Artisan Catalogue OTP is: ${otpCode}. Valid for 5 minutes.`,
        from: fromNumber,
        to: mobileNumber,
      });

      console.log(`[Twilio] SMS sent — SID: ${message.sid}`);
      return { method: 'twilio', sid: message.sid };
    } catch (err) {
      console.error(`[Twilio] Failed to send SMS: ${err.message}`);
      // Fall through to console log fallback
    }
  }

  console.log(`[OTP Fallback] Mobile: ${mobileNumber} | OTP: ${otpCode}`);
  return { method: 'console' };
}

// ─── POST /auth/otp/request ─────────────────────────────────────────────────
router.post('/otp/request', async (req, res) => {
  try {
    const { mobile_number } = req.body;

    if (!mobile_number) {
      return errorResponse(res, 400, 'mobile_number is required');
    }

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTPs for this number
    await pool.query('DELETE FROM otps WHERE mobile_number = $1', [mobile_number]);

    // Store the new OTP
    await pool.query(
      'INSERT INTO otps (mobile_number, otp_code, expires_at) VALUES ($1, $2, $3)',
      [mobile_number, otpCode, expiresAt]
    );

    // Send via Twilio or console
    const delivery = await sendOTP(mobile_number, otpCode);

    res.status(200).json({
      message: 'OTP sent successfully',
      delivery_method: delivery.method,
    });
  } catch (err) {
    console.error('OTP request error:', err);
    return errorResponse(res, 500, 'Failed to generate OTP');
  }
});

// ─── POST /auth/otp/verify ──────────────────────────────────────────────────
router.post('/otp/verify', async (req, res) => {
  try {
    const { mobile_number, otp } = req.body;

    if (!mobile_number || !otp) {
      return errorResponse(res, 400, 'mobile_number and otp are required');
    }

    // Look up the OTP
    const result = await pool.query(
      'SELECT * FROM otps WHERE mobile_number = $1 AND otp_code = $2 ORDER BY created_at DESC LIMIT 1',
      [mobile_number, otp]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 401, 'Invalid OTP');
    }

    const otpRecord = result.rows[0];

    // Check expiry
    if (new Date() > new Date(otpRecord.expires_at)) {
      // Clean up expired OTP
      await pool.query('DELETE FROM otps WHERE id = $1', [otpRecord.id]);
      return errorResponse(res, 401, 'OTP has expired');
    }

    // Delete the used OTP
    await pool.query('DELETE FROM otps WHERE mobile_number = $1', [mobile_number]);

    // Upsert the artisan
    let artisanResult = await pool.query(
      'SELECT id FROM artisans WHERE mobile_number = $1',
      [mobile_number]
    );

    let artisan_id;
    if (artisanResult.rows.length === 0) {
      artisan_id = uuidv4();
      await pool.query(
        'INSERT INTO artisans (id, mobile_number) VALUES ($1, $2)',
        [artisan_id, mobile_number]
      );
    } else {
      artisan_id = artisanResult.rows[0].id;
    }

    // Issue JWT
    const token = jwt.sign(
      { artisan_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'OTP verified successfully',
      token,
      artisan_id,
    });
  } catch (err) {
    console.error('OTP verify error:', err);
    return errorResponse(res, 500, 'Failed to verify OTP');
  }
});

module.exports = router;
