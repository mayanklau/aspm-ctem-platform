'use strict';

/**
 * Generic CRUD controller factory used by every per-report-type controller.
 *
 * Hardening notes vs v3.0:
 *
 *  1. Pagination is hard-capped (default 50, max 200) so an unauthenticated
 *     scan with `?limit=999999` cannot exhaust the connection pool.
 *
 *  2. The `?q=` search now only targets columns explicitly listed as TEXT
 *     in `searchFields`. The previous version OR-ed across `severity` and
 *     `status` (which are enums), producing broken or surprisingly-matching
 *     LIKE clauses.
 *
 *  3. LIKE wildcards (`%`, `_`, `\`) in user input are escaped before being
 *     interpolated, so `?q=%` no longer matches every row.
 *
 *  4. Sort column / direction are validated against an allowlist; the
 *     default is `created_at DESC`.
 */

const { Op } = require('sequelize');
const R = require('../utils/response');

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;
const ALLOWED_SORT_DIR = new Set(['ASC', 'DESC']);

function escapeLike(input) {
  return String(input).replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

function safePagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  return { page, limit, offset: (page - 1) * limit };
}

/**
 * @param {string} modelKey                 - key into req.app.get('models')
 * @param {string[]} searchFields           - TEXT columns safe for LIKE
 * @param {object} [opts]
 * @param {string[]} [opts.sortable]        - columns allowed in ?sort=
 */
module.exports = function baseCtrl(modelKey, searchFields = ['title', 'description'], opts = {}) {
  const sortable = new Set(opts.sortable || ['created_at', 'updated_at', 'severity', 'status']);

  return {
    async list(req, res, next) {
      const M = req.app.get('models');
      const { appId, severity, status, q, from, to, sort, dir } = req.query;
      const { page, limit, offset } = safePagination(req.query);

      const where = {};
      if (appId) where.app_id = appId;
      if (severity) where.severity = severity;
      if (status) where.status = status;

      if (from || to) {
        where.created_at = {};
        if (from) {
          const d = new Date(from);
          if (!Number.isNaN(d.getTime())) where.created_at[Op.gte] = d;
        }
        if (to) {
          const d = new Date(to);
          if (!Number.isNaN(d.getTime())) where.created_at[Op.lte] = d;
        }
      }

      if (q && searchFields.length) {
        const safe = `%${escapeLike(q)}%`;
        where[Op.or] = searchFields.map((f) => ({ [f]: { [Op.like]: safe } }));
      }

      const sortCol = sortable.has(sort) ? sort : 'created_at';
      const sortDir = ALLOWED_SORT_DIR.has(String(dir).toUpperCase())
        ? String(dir).toUpperCase()
        : 'DESC';

      try {
        const { rows, count } = await M[modelKey].findAndCountAll({
          where,
          order: [[sortCol, sortDir]],
          limit,
          offset,
        });
        return R.paginated(res, rows, count, page, limit);
      } catch (e) {
        return next(e);
      }
    },

    async getById(req, res, next) {
      const M = req.app.get('models');
      try {
        const r = await M[modelKey].findByPk(req.params.id);
        return r ? R.success(res, r) : R.notFound(res);
      } catch (e) {
        return next(e);
      }
    },

    async updateStatus(req, res, next) {
      const M = req.app.get('models');
      const { status } = req.body;
      const allowed = ['open', 'in_progress', 'resolved', 'accepted_risk', 'false_positive'];
      if (!status || !allowed.includes(status)) {
        return R.badRequest(res, `status must be one of: ${allowed.join(', ')}`);
      }
      try {
        const r = await M[modelKey].findByPk(req.params.id);
        if (!r) return R.notFound(res);
        await r.update({ status });
        return R.success(res, { id: req.params.id, status });
      } catch (e) {
        return next(e);
      }
    },

    async summary(req, res, next) {
      const M = req.app.get('models');
      const { sequelize } = M;
      const { appId } = req.query;
      const where = {};
      if (appId) where.app_id = appId;
      try {
        const c = await M[modelKey].findAll({
          where,
          attributes: [
            'severity',
            'status',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          ],
          group: ['severity', 'status'],
          raw: true,
        });
        return R.success(res, c);
      } catch (e) {
        return next(e);
      }
    },
  };
};

module.exports.escapeLike = escapeLike;
module.exports.safePagination = safePagination;
module.exports.MAX_LIMIT = MAX_LIMIT;
