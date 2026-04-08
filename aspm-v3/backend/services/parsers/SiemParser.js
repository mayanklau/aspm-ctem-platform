'use strict';
const B = require('./BaseParser');
const { v4: uuidv4 } = require('uuid');
const { parseDateTime } = require('../../utils/helpers');
const HI_KC=['execution','exfiltration','command and control','impact','lateral movement','privilege escalation'];
module.exports = class SiemParser extends B {
  constructor() { super('siem'); }
  async parse(fp, ingId) {
    const fmt=B.detect(fp);const raw=fmt==='csv'?B.readCsv(fp):fmt==='xlsx'?B.readXlsx(fp):[];
    return raw.map((r,i)=>{ try{return this._n(r,ingId);}catch(e){this.logErr(i,e.message);return null;} }).filter(Boolean);
  }
  _n(r, ingId) {
    const dc=parseDateTime(r['Date Created']||r.date_created||'');
    const cl=parseDateTime(r['Date-Time Closed']||r.date_closed||'');
    const dOpen=parseInt(r['Days Open']||r.days_open||'0')||this._days(dc,cl);
    const prio=this._p(r.Priority||r.priority||r.Criticality||'');
    const toBlock=['yes','true','1','y'].includes(String(r['To be blocked']||r.to_be_blocked||'').toLowerCase());
    const sla=this._sla(prio,dOpen,cl);
    const rec={id:uuidv4(),
      incident_id:r['Incident ID']||r.incident_id||uuidv4(),
      ciso_incident_coordinator:r['CISO incident coordinator in shift']||'',
      date_created:dc,days_open:dOpen,
      days_to_resolve:parseInt(r['Days taken to resolve']||'0')||null,
      incident_details:r['Incident Details']||'',
      incident_coordinator:r['Incident Coordinator']||'',
      incident_status:r['Incident Status']||r.incident_status||'',
      incident_summary:r['Incident Summary']||'',
      incident_validated_by:r['Incident Validated by']||'',
      justification:r.Justification||r.justification||'',
      kill_chain:r['Kill Chain']||r.kill_chain||'',
      source:r.Source||r.source||'',team:r.Team||r.team||'',
      threat_category:r['Threat Category']||r.threat_category||'',
      title:r.Title||r.title||r['Incident Summary']||'',
      validation_remarks:r['Validation Remarks (CSOC)']||r.validation_remarks||'',
      date_assigned:parseDateTime(r['Date-Time Assigned']||''),
      date_closed:cl,date_resolved:parseDateTime(r['Date-Time Resolved']||''),
      dest_hostname:r['Destination Hostname']||r.dest_hostname||'',
      dest_ip:r['Destination IP Address']||r.dest_ip||'',
      dest_port:parseInt(r['Destination Port']||'0')||null,
      incident_owner:r['Incident Owner']||r.incident_owner||'',
      overall_status:r['Ovreall Status']||r['Overall Status']||r.overall_status||'',
      priority:prio,
      siem_rule_enhancements:r['SIEM Rule Enhancements']||r.siem_rule_enhancements||'',
      source_hostname:r['Source Hostname']||r.source_hostname||'',
      criticality:r.Criticality||r.criticality||'',
      closure_remark:r['Closure Remark (CISO)']||r.closure_remark||'',
      to_be_blocked:toBlock?1:0,sla_breached:sla?1:0,risk_score:0,
      ingestion_id:ingId,raw_data:r};
    rec.risk_score=this._rs(rec); return rec;
  }
  _p(v){const s=String(v).toLowerCase();if(s==='p1'||s.includes('critical'))return 'Critical';if(s==='p2'||s.includes('high'))return 'High';if(s==='p3'||s.includes('medium'))return 'Medium';return 'Low';}
  _sla(p,d,cl){const m={Critical:1,High:3,Medium:7,Low:14};const sla=m[p]||7;if(!cl)return d>sla;return false;}
  _rs(i){let s=0;const p=(i.priority||'').toLowerCase();
    if(p.includes('critical'))s+=5;else if(p.includes('high'))s+=4;else if(p.includes('medium'))s+=3;else s+=2;
    if(i.sla_breached)s+=2;
    const kc=(i.kill_chain||'').toLowerCase();if(HI_KC.some(h=>kc.includes(h)))s+=3;
    if(i.to_be_blocked&&(i.overall_status||'').toLowerCase()!=='closed')s+=3;
    const enh=i.siem_rule_enhancements||'';s+=enh.split(/[,;|]/).filter(x=>x.trim()).length*2;
    return Math.min(s,20);}
  _days(c,cl){if(!c)return 0;const e=cl?new Date(cl):new Date();return Math.floor((e-new Date(c))/86400000);}
};
