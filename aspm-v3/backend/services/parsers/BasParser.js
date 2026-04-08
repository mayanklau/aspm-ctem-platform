'use strict';
const B = require('./BaseParser');
const { v4: uuidv4 } = require('uuid');
module.exports = class BasParser extends B {
  constructor() { super('bas'); }
  async parse(fp, appId, appName, ingId) {
    const fmt=B.detect(fp); const raw=fmt==='csv'?B.readCsv(fp):fmt==='json'?this._j(B.readJson(fp)):fmt==='xlsx'?B.readXlsx(fp):[];
    return raw.map((r,i)=>{ try{return this._n(r,appId,appName,ingId);}catch(e){this.logErr(i,e.message);return null;} }).filter(Boolean);
  }
  _j(j) { return j.results||j.scenarios||j.findings||(Array.isArray(j)?j:[j]); }
  _n(r, appId, appName, ingId) {
    const sev=B.norm(r.severity||r.Severity||r.risk||r.Risk||'medium');
    const res=(r.result||r.outcome||r.status||'').toLowerCase();
    return { id:uuidv4(), app_id:appId||r.app_id||'', app_name:appName||r.app_name||'',
      tool:r.tool||r.Tool||'other',
      simulation_date:B.date(r.date||r.run_date||r.simulation_date||''),
      technique_id:r.technique_id||r.mitre_id||'', tactic:r.tactic||r.Tactic||'',
      kill_chain_phase:r.kill_chain||r.kill_chain_phase||r.kill_chain_tactic||'',
      title:r.title||r.name||r.scenario||r.test_name||'BAS Finding',
      description:r.description||r.detail||'',
      result:res.includes('block')||res.includes('prevent')?'blocked':res.includes('partial')?'partial':res.includes('fail')?'failed':'success',
      severity:sev, severity_score:B.score(sev),
      affected_asset:r.asset||r.target||r.affected_asset||appName||'',
      status:'open', ingestion_id:ingId, raw_data:r };
  }
};
