'use strict';
const B = require('./BaseParser');
const { v4: uuidv4 } = require('uuid');
module.exports = class FirewallParser extends B {
  constructor() { super('firewall'); }
  async parse(fp, vendor, ingId) {
    const fmt=B.detect(fp); const raw=fmt==='csv'?B.readCsv(fp):fmt==='xlsx'?B.readXlsx(fp):[];
    return raw.map((r,i)=>{ try{return this._risk(this._n(r,vendor,ingId));}catch(e){this.logErr(i,e.message);return null;} }).filter(Boolean);
  }
  _n(r, vendor, ingId) {
    const date = new Date().toISOString().split('T')[0];
    if(vendor==='palo_alto') return { id:uuidv4(),vendor,ingestion_id:ingId,import_date:date,
      documentation:r.Documentation||'',rule_num:parseInt(r.RULENUM||'0')||null,
      from_zone:r.FROM||r.from||'',source:r.SOURCE||r.source||'',to_zone:r.TO||r.to||'',
      destination:r.DESTINATION||r.destination||'',service:r.SERVICE||r.service||'',
      user_field:r.USER||r.user||'',action:(r.ACTION||r.action||'allow').toLowerCase(),
      enabled:!['no','false','0'].includes(String(r.ENABLE||r.enable||'yes').toLowerCase())?1:0,
      rule_name:r.NAME||r.name||'',
      log_enabled:!['no','false','0'].includes(String(r.LOG||r.log||'yes').toLowerCase())?1:0,
      comment:r.COMMENT||r.comment||'',tag:r.TAG||r.tag||'',profile:r.PROFILE||r.profile||'',
      application:r.APPLICATION||r.application||'',url_category:r.URL_CATEGORY||r.url_category||'',raw_data:r };
    if(vendor==='fortinet') return { id:uuidv4(),vendor,ingestion_id:ingId,import_date:date,
      documentation:r.Documentation||'',rule_num:parseInt(r.RULENUM||'0')||null,
      from_zone:r.FROM||'',source:r.SOURCE||'',to_zone:r.TO||'',destination:r.DESTINATION||'',
      service:r.SERVICE||'',action:(r.ACTION||'accept').toLowerCase(),
      enabled:!['disable','no','false'].includes(String(r.ENABLE||'enable').toLowerCase())?1:0,
      rule_name:r.NAME||'',
      log_enabled:!['disable','no','false'].includes(String(r.LOG||'enable').toLowerCase())?1:0,
      comment:r.COMMENT||'',schedule:r.SCHEDULE||'',raw_data:r };
    // checkpoint
    return { id:uuidv4(),vendor:'checkpoint',ingestion_id:ingId,import_date:date,
      documentation:r.Documentation||'',rule_num:parseInt(r.RULENUM||'0')||null,
      source:r.SOURCE||'',destination:r.DESTINATION||'',action:(r.ACTION||'accept').toLowerCase(),
      enabled:!['no','false','0'].includes(String(r.ENABLE||'true').toLowerCase())?1:0,
      rule_name:r.NAME||'',
      log_enabled:!['no','none','false'].includes(String(r.TRACK||'log').toLowerCase())?1:0,
      comment:r.COMMENTS||'',service:r.SERVICES_APPLICATIONS||r.SERVICES||'',
      vpn:r.VPN||'',section_header:r.SECTION_HEADER||'',
      layer_name:r['LAYER NAME']||'',layer_type:r['LAYER TYPE']||'',
      raw_data:r };
  }
  _risk(rule) {
    let s=0; const f=[];
    const src=(rule.source||'').toLowerCase(),dst=(rule.destination||'').toLowerCase(),svc=(rule.service||'').toLowerCase();
    if(src.includes('any')&&dst.includes('any')&&!['deny','drop','reject'].includes(rule.action)){s+=4;f.push({type:'permissive',detail:'ANY/ANY'});rule.is_permissive=1;}
    else if(src.includes('any')||dst.includes('any')){s+=2;f.push({type:'semi_permissive',detail:'ANY src or dst'});rule.is_permissive=1;}
    if(!rule.log_enabled){s+=2;f.push({type:'no_log',detail:'Logging disabled'});rule.is_no_log=1;}
    if(!rule.comment&&!rule.documentation){s+=0.5;f.push({type:'undocumented',detail:'No comment'});rule.is_undocumented=1;}
    if(svc.includes('any')||svc===''){s+=1.5;f.push({type:'any_service',detail:'Service=any'});}
    if(!rule.enabled){s+=1;f.push({type:'disabled',detail:'Rule disabled'});}
    rule.risk_score=Math.round(s*100)/100; rule.risk_flags=f; return rule;
  }
};
