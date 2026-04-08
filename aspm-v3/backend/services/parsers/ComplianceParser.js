'use strict';
const B = require('./BaseParser');
const { v4: uuidv4 } = require('uuid');
module.exports = class ComplianceParser extends B {
  constructor() { super('compliance'); }
  async parse(fp, compType, assetId, ingId) {
    const fmt=B.detect(fp);const raw=fmt==='csv'?B.readCsv(fp):fmt==='xlsx'?B.readXlsx(fp):[];
    return raw.map((r,i)=>{ try{return compType==='os'?this._os(r,assetId,ingId):this._db(r,assetId,ingId);}catch(e){this.logErr(i,e.message);return null;} }).filter(Boolean);
  }
  _os(r, assetId, ingId) {
    const sev=B.norm(r.severity||r.Severity||r.Impact||'low');
    const cs=(r.compliance_status||r.ComplianceStatus||r.Result||r.result||'').toLowerCase();
    return {id:uuidv4(),asset_id:assetId||r.asset_id||'',
      hostname:r.hostname||r.Hostname||r.host||r.Host||'Unknown',
      ip_address:r.ip_address||r.IP||r.ip||'',
      os_type:r.os_type||r.OSType||r.os||r.OS||'',
      os_version:r.os_version||r.OSVersion||r.version||'',
      scan_date:B.date(r.scan_date||r.ScanDate||r.date||r.Date||''),
      benchmark_standard:r.benchmark_standard||r.Benchmark||r.standard||'',
      control_id:r.control_id||r.ControlId||r.rule||r.Rule||r.control||'',
      control_description:r.control_description||r.ControlDescription||r.description||r.rule_title||'',
      compliance_status:cs.includes('pass')||cs==='true'?'pass':cs.includes('fail')||cs==='false'?'fail':cs.includes('na')||cs.includes('not')?'not_applicable':'error',
      current_value:r.current_value||r.CurrentValue||r.actual||r.Actual||'',
      expected_value:r.expected_value||r.ExpectedValue||r.expected||r.Expected||'',
      severity:sev,severity_score:B.score(sev),
      remediation:r.remediation||r.Remediation||r.recommendation||'',
      exception_status:r.exception_status||r.ExceptionStatus||'no_exception',
      source_type:'file_upload',ingestion_id:ingId,raw_data:r};
  }
  _db(r, assetId, ingId) {
    const base=this._os(r,assetId,ingId);
    return {...base,db_hostname:r.db_hostname||r.DbHostname||r.hostname||r.Hostname||'Unknown',
      db_type:(r.db_type||r.DbType||r.database||r.Database||'other').toLowerCase(),
      db_version:r.db_version||r.DbVersion||r.version||'',
      db_instance_name:r.db_instance||r.DbInstance||r.instance||r.db_instance_name||'',
      hostname:undefined};
  }
};
