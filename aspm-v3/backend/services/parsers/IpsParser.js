'use strict';
const B = require('./BaseParser');
const { v4: uuidv4 } = require('uuid');
module.exports = class IpsParser extends B {
  constructor() { super('ips'); }
  async parse(fp, ingId) {
    const fmt=B.detect(fp);const raw=fmt==='csv'?B.readCsv(fp):fmt==='json'?this._j(B.readJson(fp)):fmt==='xlsx'?B.readXlsx(fp):[];
    return raw.map((r,i)=>{ try{return this._n(r,ingId);}catch(e){this.logErr(i,e.message);return null;} }).filter(Boolean);
  }
  _j(j){return j.signatures||(Array.isArray(j)?j:[j]);}
  _n(r, ingId) {
    const enabled=!['false','no','0','disabled'].includes(String(r.enabled||r.Enabled||r.active||'1').toLowerCase());
    const sev=B.norm(r.severity||r.Severity||r.impact||r.Risk||'medium');
    return {id:uuidv4(),vendor:this._v(r),sig_id:r.sig_id||r.SignatureId||r.id||r.gid||'',
      sig_name:r.sig_name||r.name||r.Name||r.msg||r.message||'',
      category:r.category||r.Category||r.classtype||'',severity:sev,
      action:(r.action||r.Action||r.alert||'alert').toLowerCase(),enabled:enabled?1:0,
      protocol:r.protocol||r.Protocol||'',
      cve_references:String(r.cve||r.CVE||r.references||'').split(/[,;]/).map(s=>s.trim()).filter(Boolean),
      description:r.description||r.Description||r.msg||'',policy_name:r.policy||r.Policy||r.policy_name||'',
      gap_flag:(!enabled&&['critical','high'].includes(sev))?1:0,
      gap_reason:(!enabled&&['critical','high'].includes(sev))?'Critical/High sig disabled':'',
      import_date:new Date().toISOString().split('T')[0],ingestion_id:ingId,raw_data:r};
  }
  _v(r){const k=Object.keys(r).map(x=>x.toLowerCase()).join(',');if(k.includes('suricata'))return 'suricata';if(k.includes('snort')||k.includes('gid'))return 'snort';return 'other';}
};
