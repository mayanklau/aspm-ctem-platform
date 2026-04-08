'use strict';

/**
 * Per-IP rate limiter. Defaults to 300 requests / 15 minutes, tunable via
 * RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX. We expose two limiters:
 *
 *   - apiLimiter   : applied globally to /api/*
 *   - uploadLimiter: stricter, applied only to upload endpoints (default 30/15m)
 *
 * In test mode (NODE_ENV=test) limiting is disabled to keep CI fast and
 * deterministic.
 */

const rateLimit = require('express-rate-limit');

const isTest = process.env.NODE_ENV === 'test';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const max = parseInt(process.env.RATE_LIMIT_MAX || '300', 10);
const uploadMax = parseInt(process.env.RATE_LIMIT_UPLOAD_MAX || '30', 10);

const noop = (_req, _res, next) => next();

const apiLimiter = isTest
  ? noop
  : rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too many requests, please slow down.',
      },
    });

const uploadLimiter = isTest
  ? noop
  : rateLimit({
      windowMs,
      max: uploadMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Upload rate limit exceeded.',
      },
    });

module.exports = { apiLimiter, uploadLimiter };
