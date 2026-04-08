'use strict';
const base = require('../../_base')('WafRule',['rule_name','rule_type','gap_description']);
const R = require('../../../utils/response');
module.exports = { ...base,
  async summary(req, res) {
    const M = req.app.get('models'); const { appId } = req.query; const where = {}; if (appId) where.app_id = appId;
    try { const total=await M.WafRule.count({where}); const gaps=await M.WafRule.count({where:{...where,gap_identified:1}}); const disabled=await M.WafRule.count({where:{...where,enabled:0}}); return R.success(res,{total,gaps,disabled}); }
    catch(e) { return R.error(res,e.message); }
  }
};
