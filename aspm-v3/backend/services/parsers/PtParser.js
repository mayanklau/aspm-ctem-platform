'use strict';
const B = require('./BaseParser');
const { bool } = require('../../utils/helpers');
const { v4: uuidv4 } = require('uuid');
module.exports = class PtParser extends B {
  constructor() { super('pt'); }
  async parse(fp, ptType, appId, appName, ingId) {
    const fmt=B.detect(fp);const raw=fmt==='csv'?B.readCsv(fp):fmt==='xlsx'?B.readXlsx(fp):fmt==='json'?this._j(B.readJson(fp)):[];
    return raw.map((r,i)=>{ try{return this._n(r,ptType,appId,appName,ingId);}catch(e){this.logErr(i,e.message);return null;} }).filter(Boolean);
  }
  _j(j){return j.findings||j.vulnerabilities||(Array.isArray(j)?j:[j]);}
  _n(r, ptType, appId, appName, ingId) {
    const sev=B.norm(r.Severity||r.severity||r.Risk||r.risk||r.CVSS||'');
    const base={id:uuidv4(),pt_type:ptType,app_id:appId||r.app_id||'',app_name:appName||r.app_name||'',
      engagement_id:r.engagement_id||r.EngagementId||r.engagement||'',
      engagement_date:B.date(r.engagement_date||r.EngagementDate||r.date||''),
      assessor_name:r.assessor||r.Assessor||r.assessor_name||r.tester||'',
      finding_title:r.finding_title||r.FindingTitle||r.title||r.Title||r.vulnerability||'PT Finding',
      description:r.description||r.Description||r.finding||'',
      vulnerability_class:r.vulnerability_class||r.class||r.VulnClass||'',
      owasp_category:r.owasp_category||r.owasp||r.OWASP||'',
      cwe_id:r.cwe_id||r.CWE||r.cwe||'',cve_id:r.cve_id||r.CVE||r.cve||'',
      cvss_score:parseFloat(r.cvss_score||r.CVSS||r.cvss||r['CVSS']||'0')||null,
      severity:sev,severity_score:B.score(sev),
      affected_url:r.affected_url||r.url||r.URL||'',
      affected_parameter:r.parameter||r.param||'',
      proof_of_concept:r.poc||r.PoC||r.proof_of_concept||r.evidence||'',
      remediation:r.remediation||r.Remediation||r.recommendation||'',
      status:B.status(r.status||r.Status||'open'),
      retest_status:this._rt(r.retest_status||r.RetestStatus||''),
      retest_date:B.date(r.retest_date||r.RetestDate||''),
      source_type:'file_upload',ingestion_id:ingId,raw_data:r};
    if(ptType==='mobile'){base.platform=this._pl(r.platform||r.Platform||r.PLATFORM||'');base.app_version=r.app_version||r.AppVersion||r.app_version||'';base.owasp_mobile_cat=r.owasp_mobile||r.mobile_owasp||r.owasp_mobile_cat||r['OWASP_MOBILE']||'';base.jailbreak_required=bool(r.jailbreak||r.jailbreak_required||r.JAILBREAK_REQUIRED||'n')?1:0;}
    if(ptType==='internal_webapp'){base.network_segment=r.network_segment||r.segment||'';base.source_ip_range=r.source_ip||r.ip_range||r.source_ip_range||'';}
    return base;
  }
  _pl(v){const s=v.toLowerCase();if(s.includes('both')||s.includes('all'))return 'both';if(s.includes('ios'))return 'ios';if(s.includes('android'))return 'android';return null;}
  _rt(v){const s=(v||'').toLowerCase();if(!s||s.includes('not'))return 'not_retested';if(s.includes('fix'))return 'fixed';if(s.includes('partial'))return 'partially_fixed';if(s.includes('persist'))return 'persists';return 'not_retested';}
};
