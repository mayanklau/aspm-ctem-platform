'use strict';
const B = require('./BaseParser');
const { v4: uuidv4 } = require('uuid');
module.exports = class SastParser extends B {
  constructor() { super('sast'); }
  async parse(fp, appId, appName, ingId) {
    const fmt = B.detect(fp);
    let raw = fmt==='csv'?B.readCsv(fp):fmt==='json'?this._j(B.readJson(fp)):fmt==='xlsx'?B.readXlsx(fp):[];
    return raw.map((r,i)=>{ try { return this._n(r,appId,appName,ingId); } catch(e) { this.logErr(i,e.message); return null; } }).filter(Boolean);
  }
  _j(j) { return j.issues||j.findings||j.vulnerabilities||(Array.isArray(j)?j:[j]); }
  _n(r, appId, appName, ingId) {
    const sev = B.norm(r.Severity||r.severity||r.Priority||r.Risk||r.impact||'');
    return { id:uuidv4(), app_id:appId||r.app_id||'', app_name:appName||r.app_name||'',
      tool: r.tool||r.Tool||this._tool(r), scan_date:B.date(r.scan_date||r.ScanDate||r.Date||''),
      rule_id:r.rule_id||r.RuleId||r.squid||r.QueryName||r.check_id||'',
      file_path:r.file_path||r.FilePath||r.FileName||r.Path||'',
      line_number:parseInt(r.line_number||r.LineNumber||r.Line||'0')||null,
      vulnerability_type:r.vulnerability_type||r.VulnerabilityType||r.Category||r.Type||'',
      cwe_id:r.cwe_id||r.CWE||r.Cwe||r.cwe||'',
      severity:sev, severity_score:B.score(sev),
      title:r.title||r.Title||r.IssueName||r.Message||r.finding_title||'SAST Finding',
      description:r.description||r.Description||r.Message||'',
      remediation:r.remediation||r.Remediation||r.Resolution||'',
      status:B.status(r.status||r.Status||r.State||'open'),
      ingestion_id:ingId, raw_data:r };
  }
  _tool(r) { const k=Object.keys(r).join(',').toLowerCase(); if(k.includes('sonar')) return 'sonarqube'; if(k.includes('veracode')) return 'veracode'; if(k.includes('checkmarx')) return 'checkmarx'; if(k.includes('semgrep')) return 'semgrep'; return 'other'; }
};
