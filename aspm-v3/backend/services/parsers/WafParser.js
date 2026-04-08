'use strict';
const B = require('./BaseParser');
const { v4: uuidv4 } = require('uuid');
module.exports = class WafParser extends B {
  constructor() { super('waf'); }
  async parse(fp, appId, appName, ingId) {
    const fmt=B.detect(fp); const raw=fmt==='csv'?B.readCsv(fp):fmt==='json'?this._j(B.readJson(fp)):fmt==='xlsx'?B.readXlsx(fp):[];
    return raw.map((r,i)=>{ try{return this._n(r,appId,appName,ingId);}catch(e){this.logErr(i,e.message);return null;} }).filter(Boolean);
  }
  _j(j){return j.rules||(Array.isArray(j)?j:[j]);}
  _n(r, appId, appName, ingId) {
    const exc=this._list(r.exceptions||r.Exceptions||''),wl=this._list(r.whitelist||r.Whitelist||r.whitelist_entries||r.exceptions_ips||'');
    const enabled=!['false','no','0','disabled'].includes(String(r.enabled||r.Enabled||'true').toLowerCase());
    const gap=!enabled||exc.length>10||wl.length>20;
    return { id:uuidv4(),app_id:appId||r.app_id||'',app_name:appName||r.app_name||'',
      vendor:this._vendor(r),rule_id:r.rule_id||r.RuleId||r.id||r.ID||'',
      rule_name:r.rule_name||r.RuleName||r.name||r.Name||'',rule_type:r.rule_type||r.RuleType||r.type||'',
      pattern:r.pattern||r.Pattern||r.signature||'',action:(r.action||r.Action||'block').toLowerCase(),
      enabled:enabled?1:0,exception_count:exc.length,exceptions:exc,whitelist_entries:wl,whitelist_count:wl.length,
      severity:B.norm(r.severity||r.Severity||'medium'),
      gap_identified:gap?1:0,gap_description:gap?this._gd(enabled,exc.length,wl.length):'',
      import_date:new Date().toISOString().split('T')[0],ingestion_id:ingId,raw_data:r};
  }
  _vendor(r){const k=Object.keys(r).map(x=>x.toLowerCase()).join(',');if(k.includes('imperva'))return 'imperva';if(k.includes('f5')||k.includes('asm'))return 'f5_asm';if(k.includes('modsec'))return 'modsecurity';return 'other';}
  _list(v){if(!v)return[];if(Array.isArray(v))return v;return String(v).split(/[,;|]/).map(s=>s.trim()).filter(Boolean);}
  _gd(e,exc,wl){const p=[];if(!e)p.push('Disabled');if(exc>10)p.push(`High exceptions(${exc})`);if(wl>20)p.push(`Large whitelist(${wl})`);return p.join('; ');}
};
