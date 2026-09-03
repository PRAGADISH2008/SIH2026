const jwt = require('jsonwebtoken');
const errorResponse = require('../utils/errorResponse');

/**
 * JWT authentication middleware.
 * Extracts artisan_id from the token and attaches it to req.artisan_id.
 * Returns 401 if the token is missing or invalid.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'Missing or malformed Authorization header');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.artisan_id = decoded.artisan_id;
    next();
  } catch (err) {
    return errorResponse(res, 401, 'Invalid or expired token');
  }
}

module.exports = authMiddleware;
