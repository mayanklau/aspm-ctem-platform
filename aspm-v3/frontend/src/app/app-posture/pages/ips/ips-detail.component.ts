import { Component, OnInit } from '@angular/core';
import { AppPostureService } from '../../services/app-posture.service';
@Component({ selector: 'app-ips-detail', templateUrl: './ips-detail.component.html' })
export class IpsDetailComponent implements OnInit {
  findings: any[] = []; total = 0; page = 1; limit = 50;
  summary: any[] = []; loading = false;
  selected: any = null; showPanel = false;
  filters: any = { appId:'', severity:'', status:'', q:'' };
  severities = ['critical','high','medium','low','informational'];
  statuses = ['open','in_progress','resolved','accepted_risk','false_positive'];
  constructor(private svc: AppPostureService) {}
  ngOnInit() { this.load(); this.loadSummary(); }
  load() {
    this.loading = true;
    this.svc.getFindings('ips', { page: this.page, limit: this.limit, ...this.filters }).subscribe({
      next: r => { this.findings = r.data || r; this.total = r.meta?.total || this.findings.length; this.loading = false; },
      error: () => this.loading = false
    });
  }
  loadSummary() { this.svc.getSummary('ips', { appId: this.filters.appId }).subscribe({ next: d => this.summary = d, error: () => {} }); }
  apply() { this.page = 1; this.load(); }
  clear() { this.filters = { appId:'', severity:'', status:'', q:'' }; this.apply(); }
  changePage(p: number) { this.page = p; this.load(); }
  open(f: any) { this.selected = f; this.showPanel = true; }
  close() { this.showPanel = false; }
  updateStatus(id: string, status: string) { this.svc.updateStatus('ips', id, status).subscribe({ next: () => this.load() }); }
  sevClass(s: string) { const m: any = { critical:'bg-danger', high:'bg-warning text-dark', medium:'bg-warning text-dark', low:'bg-secondary', informational:'bg-info text-dark' }; return m[s] || 'bg-secondary'; }
  totalFor(sev: string) { return this.summary.filter(s => s.severity === sev).reduce((a,b) => a + (+b.count||0), 0); }
  get pages() { return Math.ceil(this.total / this.limit); }
  objectKeys = Object.keys;
}
