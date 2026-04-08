'use strict';

/**
 * JWT authentication middleware.
 *
 * - `required`  : rejects requests without a valid token (401)
 * - `optional`  : attaches req.user if a valid token is present, else continues
 *                 unauthenticated. ONLY use on read-only public endpoints.
 * - `requireRole(...roles)` : 403 unless req.user.role matches one of the args
 *
 * Fail-fast: in production the server refuses to boot without JWT_SECRET.
 * See server.js for the boot-time check; this module will also throw if it
 * is imported into a production process without the env var set.
 */

const jwt = require('jsonwebtoken');
const R = require('../utils/response');

const { NODE_ENV = 'development' } = process.env;
const SECRET = process.env.JWT_SECRET;

if (NODE_ENV === 'production' && !SECRET) {
  throw new Error(
    '[FATAL] JWT_SECRET is required in production. Refusing to load auth middleware.'
  );
}

const DEV_SECRET = SECRET || 'aspm-dev-only-not-for-production';

function extractToken(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7).trim();
  return null;
}

function required(req, res, next) {
  const token = extractToken(req);
  if (!token) return R.unauthorized(res, 'Authentication required');
  try {
    req.user = jwt.verify(token, DEV_SECRET);
    return next();
  } catch (err) {
    return R.unauthorized(res, 'Invalid or expired token');
  }
}

function optional(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, DEV_SECRET);
    } catch (_e) {
      /* ignore — treat as anonymous */
    }
  }
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return R.unauthorized(res, 'Authentication required');
    if (!roles.includes(req.user.role)) {
      return R.forbidden(res, `Requires role: ${roles.join(' | ')}`);
    }
    return next();
  };
}

function signToken(payload, opts = {}) {
  const expiresIn = opts.expiresIn || process.env.JWT_EXPIRES_IN || '8h';
  return jwt.sign(payload, DEV_SECRET, { expiresIn });
}

module.exports = { required, optional, requireRole, signToken };
