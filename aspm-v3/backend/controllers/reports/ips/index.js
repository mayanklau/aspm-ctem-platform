'use strict';
const base = require('../../_base')('IpsSignature',['sig_name','category','description']);
const R = require('../../../utils/response');
module.exports = { ...base,
  async summary(req, res) {
    const M = req.app.get('models');
    try { const total=await M.IpsSignature.count(); const gaps=await M.IpsSignature.count({where:{gap_flag:1}}); const disabled=await M.IpsSignature.count({where:{enabled:0}}); return R.success(res,{total,gaps,disabled}); }
    catch(e) { return R.error(res,e.message); }
  }
};
