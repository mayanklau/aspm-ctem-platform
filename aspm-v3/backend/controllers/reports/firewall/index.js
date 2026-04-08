'use strict';
const { Op } = require('sequelize');
const R = require('../../../utils/response');
const { paginate } = require('../../../utils/helpers');
module.exports = {
  async list(req, res) {
    const M = req.app.get('models'); const { vendor, riskType, action, page=1, limit=100 } = req.query; const where = {};
    if (vendor) where.vendor = vendor; if (action) where.action = action;
    if (riskType === 'permissive')   where.is_permissive   = 1;
    if (riskType === 'no_log')       where.is_no_log       = 1;
    if (riskType === 'undocumented') where.is_undocumented = 1;
    try { const { rows, count } = await M.FirewallRule.findAndCountAll({ where, order: [['risk_score','DESC']], ...paginate(null,page,limit) }); return R.paginated(res, rows, count, page, limit); }
    catch(e) { return R.error(res, e.message); }
  },
  async getById(req, res) { const M = req.app.get('models'); const r = await M.FirewallRule.findByPk(req.params.id); return r ? R.success(res, r) : R.notFound(res); },
  async summary(req, res) {
    const M = req.app.get('models'); const { sequelize } = M;
    try {
      const [rows] = await sequelize.query("SELECT vendor, COUNT(*) AS total_rules, SUM(is_permissive) AS permissive_count, SUM(is_no_log) AS no_log_count, SUM(is_undocumented) AS undocumented_count, SUM(CASE WHEN enabled=0 THEN 1 ELSE 0 END) AS disabled_count, COALESCE(SUM(risk_score),0) AS total_risk_score FROM firewall_rules GROUP BY vendor");
      return R.success(res, rows);
    } catch(e) { return R.error(res, e.message); }
  }
};
