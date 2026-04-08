'use strict';
const B = require('./BaseParser');
const { v4: uuidv4 } = require('uuid');
module.exports = class CartParser extends B {
  constructor() { super('cart'); }
  async parse(fp, appId, appName, ingId) {
    const fmt=B.detect(fp); const raw=fmt==='csv'?B.readCsv(fp):fmt==='xlsx'?B.readXlsx(fp):[];
    return raw.map((r,i)=>{ try{return this._n(r,appId,appName,ingId);}catch(e){this.logErr(i,e.message);return null;} }).filter(Boolean);
  }
  _n(r, appId, appName, ingId) {
    const sev=B.norm(r.severity||r.Severity||r.Risk||r.Priority||'medium');
    return { id:uuidv4(), app_id:appId||r.app_id||'', app_name:appName||r.app_name||'',
      assessment_date:B.date(r.date||r.assessment_date||r.Date||''),
      readiness_area:r.readiness_area||r.ReadinessArea||r.category||r.Category||'',
      control_domain:r.control_domain||r.domain||r.Domain||'',
      control_id:r.control_id||r.ControlId||r.control||'',
      title:r.title||r.Title||r.finding||r.observation||'CART Finding',
      description:r.description||r.Description||'',
      gap:r.gap||r.Gap||r.gap_description||'',
      severity:sev, severity_score:B.score(sev),
      recommendation:r.recommendation||r.Recommendation||r.remediation||'',
      status:B.status(r.status||r.Status||'open'), ingestion_id:ingId, raw_data:r };
  }
};
