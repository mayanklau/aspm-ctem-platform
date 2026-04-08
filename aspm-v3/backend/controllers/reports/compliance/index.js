'use strict';
const { Op } = require('sequelize');
const R = require('../../../utils/response');
const { paginate } = require('../../../utils/helpers');
module.exports = {
  async list(req, res) {
    const M=req.app.get('models'); const{compType,assetId,hostname,complianceStatus,severity,page=1,limit=50}=req.query;
    const Model=compType==='db'?M.DbComplianceFinding:M.OsComplianceFinding; const where={};
    if(assetId)where.asset_id=assetId; if(hostname)where.hostname={[Op.like]:`%${hostname}%`};
    if(complianceStatus)where.compliance_status=complianceStatus; if(severity)where.severity=severity;
    try{const{rows,count}=await Model.findAndCountAll({where,order:[['compliance_status','ASC']],...paginate(null,page,limit)});return R.paginated(res,rows,count,page,limit);}
    catch(e){return R.error(res,e.message);}
  },
  async getById(req,res){const M=req.app.get('models');const{compType}=req.query;const Model=compType==='db'?M.DbComplianceFinding:M.OsComplianceFinding;const r=await Model.findByPk(req.params.id);return r?R.success(res,r):R.notFound(res);},
  async summary(req,res){const M=req.app.get('models');const{compType,assetId}=req.query;const Model=compType==='db'?M.DbComplianceFinding:M.OsComplianceFinding;const{sequelize}=M;const where={};if(assetId)where.asset_id=assetId;try{const c=await Model.findAll({where,attributes:['compliance_status','severity',[sequelize.fn('COUNT',sequelize.col('id')),'count']],group:['compliance_status','severity'],raw:true});return R.success(res,c);}catch(e){return R.error(res,e.message);}},
  async oracleSync(req,res){return R.success(res,{message:'Oracle sync triggered. Configure ORACLE_* env vars and ensure oracledb is installed.'});}
};
