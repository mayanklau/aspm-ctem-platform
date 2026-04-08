'use strict';

/**
 * Centralised error handling.
 *
 * - `notFoundHandler` returns a uniform 404 JSON envelope for unknown routes.
 * - `errorHandler` is the Express 4-arg middleware. It distinguishes:
 *     - Sequelize validation / unique-constraint errors  → 400
 *     - JWT errors                                       → 401
 *     - Multer file errors                               → 400
 *     - Anything with .status / .statusCode              → that
 *     - Everything else                                  → 500
 *   Stack traces are logged but never sent to clients in production.
 */

const logger = require('../utils/logger');
const R = require('../utils/response');

function notFoundHandler(req, res) {
  return R.notFound(res, `Route not found: ${req.method} ${req.originalUrl}`);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const isProd = process.env.NODE_ENV === 'production';

  // Multer
  if (err && err.name === 'MulterError') {
    logger.warn(`upload_error ${err.code} ${err.message}`, { rid: req.id });
    return R.badRequest(res, `Upload error: ${err.message}`);
  }

  // Sequelize validation
  if (err && (err.name === 'SequelizeValidationError' ||
              err.name === 'SequelizeUniqueConstraintError')) {
    logger.warn(`db_validation ${err.message}`, { rid: req.id });
    return R.badRequest(res, err.message, {
      fields: (err.errors || []).map((e) => ({ path: e.path, message: e.message })),
    });
  }

  // JWT
  if (err && (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')) {
    return R.unauthorized(res, 'Invalid or expired token');
  }

  // Explicit status
  const status = err && (err.status || err.statusCode) ? (err.status || err.statusCode) : 500;

  if (status >= 500) {
    logger.error(`unhandled ${err && err.message}`, {
      rid: req.id,
      stack: err && err.stack,
    });
  } else {
    logger.warn(`client_error ${status} ${err && err.message}`, { rid: req.id });
  }

  return R.error(
    res,
    isProd && status >= 500 ? 'Internal server error' : (err && err.message) || 'Error',
    status
  );
}

module.exports = { notFoundHandler, errorHandler };
