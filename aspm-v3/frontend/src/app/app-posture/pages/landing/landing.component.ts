import { Component, OnInit } from '@angular/core';
import { AppPostureService } from '../../services/app-posture.service';

@Component({ selector: 'app-landing', templateUrl: './landing.component.html' })
export class LandingComponent implements OnInit {
  apps: any[] = []; enterprise: any = null; selectedApp: any = null;
  heatmap: any[] = []; loading = true; computing = false;
  trendLabels: string[] = []; trendData: any[] = [];

  reportNav = [
    { label:'SAST',          path:'sast',         icon:'fa-code',            color:'#4e73df', desc:'Static Analysis' },
    { label:'DAST',          path:'dast',         icon:'fa-globe',           color:'#36b9cc', desc:'Dynamic Scanning' },
    { label:'SCA',           path:'sca',          icon:'fa-box-open',        color:'#1cc88a', desc:'Components' },
    { label:'BAS',           path:'bas',          icon:'fa-robot',           color:'#f6c23e', desc:'Breach Simulation' },
    { label:'CART',          path:'cart',         icon:'fa-clipboard-check', color:'#e74a3b', desc:'Readiness Test' },
    { label:'Firewall',      path:'firewall',     icon:'fa-shield-halved',   color:'#5a5c69', desc:'Rule Analysis' },
    { label:'WAF',           path:'waf',          icon:'fa-filter',          color:'#2e59d9', desc:'Config Gaps' },
    { label:'IPS',           path:'ips',          icon:'fa-eye',             color:'#17a673', desc:'Sig Coverage' },
    { label:'SIEM',          path:'siem',         icon:'fa-chart-line',      color:'#2c9faf', desc:'Incidents' },
    { label:'PT External',   path:'pt-external',  icon:'fa-earth-americas',  color:'#be2617', desc:'Web App PT' },
    { label:'PT Internal',   path:'pt-internal',  icon:'fa-network-wired',   color:'#913d88', desc:'Internal PT' },
    { label:'PT Mobile',     path:'pt-mobile',    icon:'fa-mobile-screen',   color:'#e05b28', desc:'Mobile PT' },
    { label:'Red Team',      path:'redteam',      icon:'fa-user-secret',     color:'#c0392b', desc:'Attack Sim' },
    { label:'Audit',         path:'audit',        icon:'fa-file-contract',   color:'#6f42c1', desc:'RBI / CERT-In' },
    { label:'OS Compliance', path:'os-compliance',icon:'fa-server',          color:'#20c997', desc:'CIS Benchmarks' },
    { label:'DB Compliance', path:'db-compliance',icon:'fa-database',        color:'#fd7e14', desc:'DB Controls' },
  ];

  constructor(private svc: AppPostureService) {}

  ngOnInit() {
    this.svc.getAllScores({ orderBy:'final_posture_score', order:'ASC', limit:100 }).subscribe({
      next: r => {
        this.apps = r.data || r;
        this.loading = false;
        if (this.apps.length) this.selectApp(this.apps[0]);
      }, error: () => this.loading = false
    });
    this.svc.getEnterpriseScores().subscribe({ next: e => this.enterprise = e, error: () => {} });
  }

  selectApp(app: any) {
    this.selectedApp = app;
    this.svc.getCoverageHeatmap(app.app_id).subscribe({ next: d => this.heatmap = d.heatmap || [], error: () => {} });
    this.svc.getScoreTrend(app.app_id).subscribe({
      next: (trend: any[]) => {
        this.trendLabels = trend.map(t => t.snapshot_date?.slice(5) || '');
        this.trendData = [
          { label:'Final Posture', data: trend.map(t => t.final_posture_score), borderColor:'#2e5bff', backgroundColor:'rgba(46,91,255,.1)', fill:true, tension:.4, pointRadius:3 },
          { label:'New App Score', data: trend.map(t => t.new_app_security_score), borderColor:'#fb8c00', backgroundColor:'transparent', fill:false, tension:.4, pointRadius:3 },
        ];
      }, error: () => {}
    });
  }

  compute() {
    if (!this.selectedApp) return;
    this.computing = true;
    this.svc.recomputeScore(this.selectedApp.app_id).subscribe({
      next: d => { this.computing = false; this.selectedApp = { ...this.selectedApp, ...d }; this.loadApps(); },
      error: () => this.computing = false
    });
  }
  loadApps() { this.svc.getAllScores({ orderBy:'final_posture_score', order:'ASC', limit:100 }).subscribe({ next: r => this.apps = r.data || r }); }

  scoreColor(s: number) { return s <= 4 ? '#e53935' : s <= 7 ? '#fb8c00' : '#2e7d32'; }
  scoreBg(s: number)    { return s <= 4 ? '#fdecea' : s <= 7 ? '#fff3e0' : '#e8f5e9'; }
  heatBg(h: any)   { if (!h.assessed) return '#f5f5f5'; const s = h.norm_score ?? 0; return s <= 4 ? '#fdecea' : s <= 7 ? '#fff3e0' : '#e8f5e9'; }
  heatColor(h: any){ if (!h.assessed) return '#bbb'; const s = h.norm_score ?? 0; return s <= 4 ? '#c62828' : s <= 7 ? '#e65100' : '#1b5e20'; }
  buBg(s: number)   { return s <= 4 ? '#fdecea' : s <= 7 ? '#fff3e0' : '#e8f5e9'; }
  buColor(s: number){ return s <= 4 ? '#c62828' : s <= 7 ? '#e65100' : '#1b5e20'; }

  get sevChartLabels() { return ['Critical','High','Medium','Low']; }
  get sevChartData() {
    if (!this.selectedApp) return [];
    return [{
      data: [this.selectedApp.total_critical, this.selectedApp.total_high, this.selectedApp.total_medium, this.selectedApp.total_low],
      backgroundColor: ['#e53935','#fb8c00','#fdd835','#43a047'],
      borderRadius: 6, borderSkipped: false
    }];
  }

  exportCsv() {
    const rows = this.apps.map(a => `${a.app_id},${a.app_name},${a.business_unit},${a.final_posture_score},${a.total_critical},${a.total_high},${a.coverage_percentage}`);
    const csv = ['App ID,Name,BU,Final Score,Critical,High,Coverage%', ...rows].join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'posture_scores.csv'; a.click();
  }

  getScoreTrend(appId: string) { return this.svc.getScoreTrend(appId); }
}
