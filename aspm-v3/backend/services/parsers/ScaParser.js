'use strict';
const B = require('./BaseParser');
const { v4: uuidv4 } = require('uuid');
module.exports = class ScaParser extends B {
  constructor() { super('sca'); }
  async parse(fp, appId, appName, ingId) {
    const fmt=B.detect(fp); let raw=fmt==='csv'?B.readCsv(fp):fmt==='json'?this._j(B.readJson(fp)):fmt==='xlsx'?B.readXlsx(fp):[];
    return raw.map((r,i)=>{ try{return this._n(r,appId,appName,ingId);}catch(e){this.logErr(i,e.message);return null;} }).filter(Boolean);
  }
  _j(j) { return j.vulnerabilities||j.results||(Array.isArray(j)?j:[j]); }
  _n(r, appId, appName, ingId) {
    const sev=B.norm(r.severity||r.Severity||r.cvssV3Severity||'');
    return { id:uuidv4(), app_id:appId||r.app_id||'', app_name:appName||r.app_name||'',
      tool:r.tool||r.Tool||'other', scan_date:B.date(r.scan_date||r.Date||''),
      library_name:r.package||r.Package||r.component||r.library||r.moduleName||r.dependency||'Unknown',
      library_version:r.version||r.Version||r.currentVersion||'',
      cve_id:r.cve||r.CVE||r.cve_id||r.identifiers||'',
      cvss_score:parseFloat(r.cvssScore||r.score||r.cvss_score||r.CVSS||'0')||null,
      severity:sev, severity_score:B.score(sev),
      title:r.title||r.issue||r.name||r.vulnerabilityName||'SCA Finding',
      description:r.description||r.overview||'',
      fixed_version:r.fixedIn||r.fixed_version||r.upgradeAvailable||'',
      status:B.status(r.status||r.Status||'open'), ingestion_id:ingId, raw_data:r };
  }
};
