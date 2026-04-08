'use strict';
const B = require('./BaseParser');
const { v4: uuidv4 } = require('uuid');
module.exports = class DastParser extends B {
  constructor() { super('dast'); }
  async parse(fp, appId, appName, ingId) {
    const fmt = B.detect(fp);
    let raw = fmt==='csv'?B.readCsv(fp):fmt==='json'?this._j(B.readJson(fp)):fmt==='xml'?await this._x(fp):fmt==='xlsx'?B.readXlsx(fp):[];
    return raw.map((r,i)=>{ try{return this._n(r,appId,appName,ingId);}catch(e){this.logErr(i,e.message);return null;} }).filter(Boolean);
  }
  _j(j) { if(j.site){const a=[];(Array.isArray(j.site)?j.site:[j.site]).forEach(s=>(s.alerts||[]).forEach(al=>(al.alertItem||[al]).forEach(i=>a.push(i))));return a;} return j.issue_events?j.issue_events.map(e=>e.issue||e):Array.isArray(j)?j:[j]; }
  async _x(fp) { const o=await B.readXml(fp); if(o.OWASPZAPReport){const a=[];(Array.isArray(o.OWASPZAPReport.site)?o.OWASPZAPReport.site:[o.OWASPZAPReport.site]).forEach(s=>{const al=s.alerts?.alertitem||[];(Array.isArray(al)?al:[al]).filter(Boolean).forEach(i=>a.push(i));});return a;} return []; }
  _n(r, appId, appName, ingId) {
    const sev = B.norm(r.risk||r.Risk||r.severity||r.Severity||'');
    return { id:uuidv4(), app_id:appId||r.app_id||'', app_name:appName||r.app_name||'',
      tool:r.tool||r.Tool||'other', scan_date:B.date(r.scan_date||r.ScanDate||r.Date||''),
      alert_type:r.alert||r.Alert||r.issue_type||r.type||r.Type||'',
      cwe_id:r.cweid||r.cwe||r.CWE||'', affected_url:r.url||r.URL||r.uri||r.host||'',
      http_method:r.method||r.Method||'', parameter:r.param||r.parameter||r.Param||'',
      attack:r.attack||r.Attack||r.Payload||'', evidence:r.evidence||r.Evidence||r.other||'',
      severity:sev, severity_score:B.score(sev),
      title:r.alert||r.name||r.Name||r.issue_type||r.type||'DAST Finding',
      description:r.description||r.Description||r.detail||'',
      solution:r.solution||r.Solution||r.remediation||'',
      status:B.status(r.status||r.Status||'open'), ingestion_id:ingId, raw_data:r };
  }
};
