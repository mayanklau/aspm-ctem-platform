'use strict';
const { Op } = require('sequelize');
const base = require('../../_base')('PtFinding',['finding_title','description','owasp_category','affected_url']);
const R = require('../../../utils/response');
const { paginate } = require('../../../utils/helpers');
module.exports = { ...base,
  async list(req, res) {
    const M = req.app.get('models'); const { ptType, appId, severity, status, platform, page=1, limit=50, q } = req.query; const where = {};
    if (ptType) where.pt_type=ptType; if (appId) where.app_id=appId; if (severity) where.severity=severity; if (status) where.status=status; if (platform) where.platform=platform;
    if (q) where[Op.or]=[{finding_title:{[Op.like]:`%${q}%`}},{description:{[Op.like]:`%${q}%`}},{affected_url:{[Op.like]:`%${q}%`}}];
    try { const{rows,count}=await M.PtFinding.findAndCountAll({where,order:[['severity_score','DESC']],...paginate(null,page,limit)}); return R.paginated(res,rows,count,page,limit); }
    catch(e){return R.error(res,e.message);}
  },
  async updateRetest(req,res){const M=req.app.get('models');const r=await M.PtFinding.findByPk(req.params.id);if(!r)return R.notFound(res);await r.update({retest_status:req.body.retest_status,retest_date:req.body.retest_date});return R.success(res,{id:r.id});}
};
