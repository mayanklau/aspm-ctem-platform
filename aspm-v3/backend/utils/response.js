'use strict';

/**
 * Uniform JSON response envelope.
 *
 * Every response includes `success`, a `timestamp`, and — when available —
 * the per-request `X-Request-Id` for correlation with logs.
 */

function rid(res) {
  return res.req && res.req.id ? { request_id: res.req.id } : {};
}

module.exports = {
  success(res, data, status = 200) {
    return res.status(status).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      ...rid(res),
    });
  },

  paginated(res, rows, total, page, limit) {
    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 50;
    return res.json({
      success: true,
      data: rows,
      meta: {
        total,
        page: p,
        limit: l,
        pages: Math.ceil(total / l),
      },
      timestamp: new Date().toISOString(),
      ...rid(res),
    });
  },

  error(res, message, status = 500, extra = {}) {
    return res.status(status).json({
      success: false,
      error: message,
      ...extra,
      timestamp: new Date().toISOString(),
      ...rid(res),
    });
  },

  notFound(res, message = 'Record not found') {
    return res.status(404).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      ...rid(res),
    });
  },

  badRequest(res, message = 'Invalid request', details) {
    return res.status(400).json({
      success: false,
      error: message,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      ...rid(res),
    });
  },

  unauthorized(res, message = 'Unauthorized') {
    return res.status(401).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      ...rid(res),
    });
  },

  forbidden(res, message = 'Forbidden') {
    return res.status(403).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      ...rid(res),
    });
  },
};
