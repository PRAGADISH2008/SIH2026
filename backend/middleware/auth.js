const jwt = require('jsonwebtoken');
const errorResponse = require('../utils/errorResponse');

/**
 * JWT authentication middleware.
 * Verifies bearer token, attaches decoded claims, req.role, req.artisan_id, req.user_id.
 * Returns 401 if missing or invalid.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'Missing or malformed Authorization header');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.role = decoded.role || (decoded.artisan_id ? 'artisan' : (decoded.user_id ? 'buyer' : null));
    req.artisan_id = decoded.artisan_id || (req.role === 'artisan' ? (decoded.id || decoded.user_id) : null);
    req.user_id = decoded.user_id || decoded.id;
    next();
  } catch (err) {
    return errorResponse(res, 401, 'Invalid or expired token');
  }
}

/**
 * Role-based authorization middleware.
 * Returns 403 Forbidden if req.role does not match expected role.
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.role || req.role !== role) {
      return errorResponse(res, 403, `Forbidden: ${role} access required`);
    }
    next();
  };
}

authMiddleware.authMiddleware = authMiddleware;
authMiddleware.requireRole = requireRole;

module.exports = authMiddleware;
