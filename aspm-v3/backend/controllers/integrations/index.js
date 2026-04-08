'use strict';
const axios = require('axios');
const R = require('../../utils/response');
module.exports = {
  async list(req,res){const M=req.app.get('models');const c=await M.IntegrationConfig.findAll({order:[['name','ASC']]});return R.success(res,c.map(x=>({...x.toJSON(),credentials:x.credentials?{configured:true}:null})));},
  async create(req,res){const M=req.app.get('models');try{const c=await M.IntegrationConfig.create(req.body);const sch=req.app.get('scheduler');if(sch&&c.enabled)sch.schedule(c);return R.success(res,{id:c.id,name:c.name},201);}catch(e){return R.error(res,e.message,400);}},
  async update(req,res){const M=req.app.get('models');const c=await M.IntegrationConfig.findByPk(req.params.id);if(!c)return R.notFound(res);await c.update(req.body);const sch=req.app.get('scheduler');if(sch){sch.unschedule(c.id);if(c.enabled)sch.schedule(c);}return R.success(res,{success:true});},
  async delete(req,res){const M=req.app.get('models');const c=await M.IntegrationConfig.findByPk(req.params.id);if(!c)return R.notFound(res);const sch=req.app.get('scheduler');if(sch)sch.unschedule(c.id);await c.destroy();return R.success(res,{success:true});},
  async triggerSync(req,res){const sch=req.app.get('scheduler');if(!sch)return R.error(res,'Scheduler unavailable',503);sch.runSync(req.params.id).catch(()=>{});return R.success(res,{message:'Sync triggered',id:req.params.id});},
  async testConnection(req,res){const{endpoint_url,auth_type,credentials}=req.body;const headers={};if(auth_type==='api_key'&&credentials?.api_key)headers['X-API-Key']=credentials.api_key;if(auth_type==='bearer'&&credentials?.token)headers['Authorization']=`Bearer ${credentials.token}`;try{const r=await axios.get(endpoint_url,{headers,timeout:10000});return R.success(res,{success:true,status:r.status});}catch(e){return R.success(res,{success:false,error:e.message,status:e.response?.status});}}
};
