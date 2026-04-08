'use strict';
const { Op } = require('sequelize');
const R = require('../../../utils/response');
const { paginate } = require('../../../utils/helpers');
module.exports = {
  async list(req, res) {
    const M = req.app.get('models'); const { priority, status, slaBreached, toBeBlocked, page=1, limit=50, q } = req.query; const where = {};
    if (priority) where.priority = priority; if (status) where.incident_status = status;
    if (slaBreached === 'true') where.sla_breached = 1; if (toBeBlocked === 'true') where.to_be_blocked = 1;
    if (q) where[Op.or] = [{ title:{[Op.like]:`%${q}%`} },{ incident_id:{[Op.like]:`%${q}%`} },{ dest_hostname:{[Op.like]:`%${q}%`} }];
    try { const { rows, count } = await M.SiemIncident.findAndCountAll({ where, order:[['risk_score','DESC'],['date_created','DESC']], ...paginate(null,page,limit) }); return R.paginated(res,rows,count,page,limit); }
    catch(e) { return R.error(res,e.message); }
  },
  async getById(req,res){const M=req.app.get('models');const r=await M.SiemIncident.findByPk(req.params.id);return r?R.success(res,r):R.notFound(res);},
  async updateStatus(req,res){const M=req.app.get('models');const r=await M.SiemIncident.findByPk(req.params.id);if(!r)return R.notFound(res);await r.update({incident_status:req.body.status});return R.success(res,{id:r.id,status:req.body.status});},
  async summary(req, res) {
    const M = req.app.get('models'); const { sequelize } = M;
    try { const [rows]=await sequelize.query("SELECT priority, COUNT(*) total, SUM(sla_breached) sla_breached, SUM(to_be_blocked) to_block FROM siem_incidents GROUP BY priority"); return R.success(res,rows); }
    catch(e) { return R.error(res,e.message); }
  },
  async killChainDistribution(req, res) {
    const M = req.app.get('models'); const { sequelize } = M;
    try { const [rows]=await sequelize.query("SELECT kill_chain, COUNT(*) count, SUM(sla_breached) sla_breached_count FROM siem_incidents WHERE kill_chain IS NOT NULL AND kill_chain!='' GROUP BY kill_chain ORDER BY count DESC LIMIT 20"); return R.success(res,rows); }
    catch(e) { return R.error(res,e.message); }
  }
};
