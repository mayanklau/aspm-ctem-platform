'use strict';
const { Op } = require('sequelize');
const SEV = { critical:5, high:4, medium:3, low:2, informational:1, info:1 };
const DEFAULT_W = { sast:7,dast:7,sca:6,vas:6,bas:7,cart:6,firewall:5,waf:5,ips:5,siem:7,pt_external:8,pt_internal:6,pt_mobile:8,red_team:8,audit:5,os_compliance:5,db_compliance:5 };

class ScoringEngine {
  constructor(models) { this.M = models; }

  async _W() {
    try {
      const rows = await this.M.ReportWeightage.findAll({ where: { enabled: 1 } });
      const w = { ...DEFAULT_W };
      rows.forEach(r => { w[r.report_type] = parseFloat(r.weightage); });
      return w;
    } catch { return { ...DEFAULT_W }; }
  }

  _raw(findings) {
    return findings.reduce((s, f) => s + (SEV[(f.severity || 'low').toLowerCase()] ?? 2), 0);
  }

  _norm(raw, weight, count) {
    if (!count) return 0;
    const avg = raw / count;     // 0–5
    return parseFloat(Math.min(10, (avg / 5) * 10).toFixed(2));
  }

  async computeApplicationScore(appId) {
    const W = await this._W();
    const M = this.M;

    const [sast, dast, sca, bas, cart, waf, ips, fw, siem,
           ptE, ptI, ptM, rt, audit, osC, dbC] = await Promise.all([
      M.SastFinding.findAll({ where: { app_id: appId, status: { [Op.ne]: 'resolved' } } }),
      M.DastFinding.findAll({ where: { app_id: appId, status: { [Op.ne]: 'resolved' } } }),
      M.ScaFinding.findAll({ where: { app_id: appId, status: { [Op.ne]: 'resolved' } } }),
      M.BasFinding.findAll({ where: { app_id: appId, status: { [Op.ne]: 'resolved' } } }),
      M.CartFinding.findAll({ where: { app_id: appId } }),
      M.WafRule.findAll({ where: { app_id: appId, gap_identified: 1 } }),
      M.IpsSignature.findAll({ where: { gap_flag: 1 } }),
      M.FirewallRule.findAll({ where: { is_permissive: 1 } }),
      M.SiemIncident.findAll({ where: { app_id: appId, sla_breached: 1 } }),
      M.PtFinding.findAll({ where: { app_id: appId, pt_type: 'external_webapp', status: { [Op.ne]: 'resolved' } } }),
      M.PtFinding.findAll({ where: { app_id: appId, pt_type: 'internal_webapp', status: { [Op.ne]: 'resolved' } } }),
      M.PtFinding.findAll({ where: { app_id: appId, pt_type: 'mobile', status: { [Op.ne]: 'resolved' } } }),
      M.RedTeamFinding.findAll({ where: { app_id: appId, status: { [Op.ne]: 'resolved' } } }),
      M.AuditFinding.findAll({ where: { app_id: appId, status: { [Op.notIn]: ['closed'] } } }),
      M.OsComplianceFinding.findAll({ where: { asset_id: appId, compliance_status: 'fail' } }),
      M.DbComplianceFinding.findAll({ where: { asset_id: appId, compliance_status: 'fail' } }),
    ]);

    const cpr = await this._cpr(appId);

    const norms = {
      sast_norm_score:       this._norm(this._raw(sast), W.sast, sast.length),
      dast_norm_score:       this._norm(this._raw(dast), W.dast, dast.length),
      sca_norm_score:        this._norm(this._raw(sca),  W.sca,  sca.length),
      va_norm_score:         0,
      bas_norm_score:        this._norm(this._raw(bas),  W.bas,  bas.length),
      cart_norm_score:       this._norm(this._raw(cart), W.cart, cart.length),
      waf_norm_score:        this._norm(waf.reduce((s,r)=>s+(r.exception_count>10?3:1),0), W.waf,  Math.max(waf.length,1)),
      ips_norm_score:        this._norm(ips.length*3,   W.ips,  Math.max(ips.length,1)),
      fw_norm_score:         this._norm(fw.reduce((s,r)=>s+parseFloat(r.risk_score||0),0), W.firewall, Math.max(fw.length,1)),
      siem_norm_score:       this._norm(siem.reduce((s,r)=>s+parseFloat(r.risk_score||0),0), W.siem, Math.max(siem.length,1)),
      pt_ext_norm_score:     this._norm(this._raw(ptE), W.pt_external, ptE.length),
      pt_int_norm_score:     this._norm(this._raw(ptI), W.pt_internal, ptI.length),
      pt_mobile_norm_score:  this._norm(this._raw(ptM), W.pt_mobile,   ptM.length),
      red_team_norm_score:   this._norm(this._raw(rt),  W.red_team,    rt.length),
      audit_norm_score:      this._norm(audit.reduce((s,f)=>s+(SEV[(f.severity||'low').toLowerCase()]??2)*(f.repeat_finding?1.5:1),0), W.audit, Math.max(audit.length,1)),
      os_comp_norm_score:    this._norm(this._raw(osC), W.os_compliance, osC.length),
      db_comp_norm_score:    this._norm(this._raw(dbC), W.db_compliance, dbC.length),
    };

    const actMap = { sast, dast, sca, bas, cart, waf, ips, firewall: fw, siem,
      pt_external: ptE, pt_internal: ptI, pt_mobile: ptM, red_team: rt, audit, os_compliance: osC, db_compliance: dbC };
    const keyToNorm = { sast:'sast_norm_score',dast:'dast_norm_score',sca:'sca_norm_score',bas:'bas_norm_score',cart:'cart_norm_score',waf:'waf_norm_score',ips:'ips_norm_score',firewall:'fw_norm_score',siem:'siem_norm_score',pt_external:'pt_ext_norm_score',pt_internal:'pt_int_norm_score',pt_mobile:'pt_mobile_norm_score',red_team:'red_team_norm_score',audit:'audit_norm_score',os_compliance:'os_comp_norm_score',db_compliance:'db_comp_norm_score' };

    const assessed = Object.keys(actMap).filter(k => (actMap[k]||[]).length > 0);
    const notAssessed = Object.keys(actMap).filter(k => !assessed.includes(k));
    const scores = assessed.map(k => norms[keyToNorm[k]] || 0);
    const newApp = scores.length ? parseFloat((scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2)) : 0;
    const final  = parseFloat(Math.min(10, (newApp * 0.6) + (cpr * 0.4)).toFixed(2));

    const all = [...sast,...dast,...sca,...bas,...cart,...ptE,...ptI,...ptM,...rt,...audit,...osC,...dbC];
    const counts = { critical:0, high:0, medium:0, low:0 };
    all.forEach(f => { const s = (f.severity||'low').toLowerCase(); if(s in counts) counts[s]++; });

    return { app_id: appId, ...norms,
      new_app_security_score: newApp, cpr_score: parseFloat(cpr.toFixed(2)), final_posture_score: final,
      reports_assessed: JSON.stringify(assessed), reports_not_assessed: JSON.stringify(notAssessed),
      coverage_percentage: parseFloat(((assessed.length/17)*100).toFixed(2)),
      total_critical: counts.critical, total_high: counts.high, total_medium: counts.medium,
      total_low: counts.low, total_open: all.length, last_computed_at: new Date() };
  }

  async computeEnterpriseScores() {
    const all = await this.M.AppPostureScore.findAll();
    const bu = {}, dom = {};
    all.forEach(a => {
      const b = a.business_unit || 'Unclassified', d = a.domain || 'Unclassified';
      (bu[b] = bu[b] || []).push(a);
      (dom[d] = dom[d] || []).push(a);
    });
    const bankScore = all.length ? all.reduce((s,a) => s + parseFloat(a.final_posture_score||0), 0) / all.length : 0;
    const wAvg = apps => { const wm={critical:4,high:3,medium:2,low:1}; let ws=0,ss=0; apps.forEach(a=>{const w=wm[a.asset_criticality]||1;ss+=parseFloat(a.final_posture_score||0)*w;ws+=w;}); return ws?parseFloat((ss/ws).toFixed(2)):0; };
    return {
      bank_score: parseFloat(bankScore.toFixed(2)),
      business_units: Object.entries(bu).map(([name,apps])=>({name,score:wAvg(apps),app_count:apps.length,critical_count:apps.reduce((s,a)=>s+(a.total_critical||0),0)})),
      domains: Object.entries(dom).map(([name,apps])=>({name,score:wAvg(apps),app_count:apps.length}))
    };
  }

  async _cpr(appId) {
    try {
      const r = await this.M.CprScore.findOne({ where: { app_id: appId } });
      return parseFloat(r?.cpr_score || '5');
    } catch { return 5.0; }
  }
}

module.exports = ScoringEngine;
