'use strict';
const B = require('./BaseParser');
const { bool } = require('../../utils/helpers');
const { v4: uuidv4 } = require('uuid');
module.exports = class AuditParser extends B {
  constructor() { super('audit'); }
  async parse(fp, appId, appName, ingId) {
    const fmt=B.detect(fp);const raw=fmt==='csv'?B.readCsv(fp):fmt==='xlsx'?B.readXlsx(fp):[];
    return raw.map((r,i)=>{ try{return this._n(r,appId,appName,ingId);}catch(e){this.logErr(i,e.message);return null;} }).filter(Boolean);
  }
  _n(r, appId, appName, ingId) {
    const sev=B.norm(r.severity||r.Severity||r.Rating||r.Priority||'medium');
    const at=(r.audit_type||r.AuditType||r.type||'internal').toLowerCase();
    return {id:uuidv4(),app_id:appId||r.app_id||'',app_name:appName||r.app_name||'',
      observation_id:r.observation_id||r.ObservationId||r.id||r.ID||'',
      audit_type:at.includes('rbi')?'rbi':at.includes('sebi')?'sebi':at.includes('cert')?'cert_in':at.includes('iso')?'iso':at.includes('ext')?'external':at.includes('reg')?'regulatory':'internal',
      audit_date:B.date(r.audit_date||r.AuditDate||r.date||r.Date||''),
      business_unit:r.business_unit||r.BusinessUnit||r.bu||'',
      observation_title:r.observation_title||r.ObservationTitle||r.title||r.Title||r.finding||'Audit Finding',
      observation_desc:r.observation_desc||r.description||r.Description||r.detail||'',
      severity:sev,severity_score:B.score(sev),
      repeat_finding:bool(r.repeat_finding||r.RepeatFinding||r.repeat||'false')?1:0,
      due_date:B.date(r.due_date||r.DueDate||r.target_date||''),
      owner:r.owner||r.Owner||r.responsible||'',
      management_response:r.management_response||r.ManagementResponse||r.response||'',
      action_plan:r.action_plan||r.ActionPlan||r.actions||'',
      status:B.status(r.status||r.Status||'open'),ingestion_id:ingId,raw_data:r};
  }
};
