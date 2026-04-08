'use strict';
const B = require('./BaseParser');
const { bool } = require('../../utils/helpers');
const { v4: uuidv4 } = require('uuid');
module.exports = class RedTeamParser extends B {
  constructor() { super('redteam'); }
  async parse(fp, appId, appName, ingId) {
    const fmt=B.detect(fp);const raw=fmt==='csv'?B.readCsv(fp):fmt==='xlsx'?B.readXlsx(fp):[];
    return raw.map((r,i)=>{ try{return this._n(r,appId,appName,ingId);}catch(e){this.logErr(i,e.message);return null;} }).filter(Boolean);
  }
  _n(r, appId, appName, ingId) {
    const sev=B.norm(r.severity||r.Severity||r.Risk||r.risk||'high');
    const et=(r.engagement_type||r.type||r.Type||'').toLowerCase();
    return {id:uuidv4(),app_id:appId||r.app_id||'',app_name:appName||r.app_name||'',
      engagement_id:r.engagement_id||r.EngagementId||'',
      engagement_date:B.date(r.engagement_date||r.date||r.Date||''),
      engagement_type:et.includes('purple')?'purple_team':et.includes('hunt')?'threat_hunting':et.includes('table')?'tabletop':'red_team',
      technique_id:r.technique_id||r.mitre_id||r.TechniqueId||'',
      technique_name:r.technique_name||r.TechniqueName||r.technique||'',
      tactic:r.tactic||r.Tactic||r.kill_chain_tactic||'',
      sub_technique:r.sub_technique||r.SubTechnique||'',
      finding_title:r.finding_title||r.title||r.Title||r.observation||'Red Team Finding',
      description:r.description||r.Description||r.detail||'',
      affected_asset:r.affected_asset||r.asset||r.target||appName||'',
      evidence:r.evidence||r.Evidence||r.proof||'',
      severity:sev,severity_score:B.score(sev),
      detection_gap:bool(r.detection_gap||r.DetectionGap||'false')?1:0,
      prevention_gap:bool(r.prevention_gap||r.PreventionGap||'false')?1:0,
      remediation:r.remediation||r.Remediation||r.recommendation||'',
      status:B.status(r.status||r.Status||'open'),ingestion_id:ingId,raw_data:r};
  }
};
