/**
 * Send a standardised error response.
 * Shape: { error: true, message: string, code: number }
 * Matches the error format defined in tech-stack.md.
 */
function errorResponse(res, code, message) {
  return res.status(code).json({
    error: true,
    message,
    code,
  });
}

module.exports = errorResponse;
