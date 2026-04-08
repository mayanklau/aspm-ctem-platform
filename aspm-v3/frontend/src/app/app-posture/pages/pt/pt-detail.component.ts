import { Component, OnInit } from '@angular/core';
import { AppPostureService } from '../../services/app-posture.service';
@Component({ selector: 'app-pt-detail', templateUrl: './pt-detail.component.html' })
export class PtDetailComponent implements OnInit {
  findings: any[] = []; total = 0; page = 1; limit = 50; loading = false;
  selected: any = null; showPanel = false;
  filters: any = { ptType: 'external_webapp', severity: '', status: '', appId: '' };
  columns = [{"key":"severity","label":"Sev"},{"key":"finding_title","label":"Finding"},{"key":"vulnerability_class","label":"Class"},{"key":"owasp_category","label":"OWASP"},{"key":"cvss_score","label":"CVSS"},{"key":"app_name","label":"App"}];
  constructor(private svc: AppPostureService) {}
  ngOnInit() { this.load(); }
  load() { this.loading = true; this.svc.getFindings('pt', { page: this.page, limit: this.limit, ...this.filters }).subscribe({ next: (r: any) => { this.findings = r.data; this.total = r.meta?.total ?? 0; this.loading = false; }, error: () => this.loading = false }); }
  setType(t: string) { this.filters.ptType = t; this.page = 1; this.load(); }
  onFilter() { this.page = 1; this.load(); }
  onClear() { const t = this.filters.ptType; this.filters = { ptType: t, severity: '', status: '', appId: '' }; this.load(); }
  onPage(p: number) { this.page = p; this.load(); }
  onRow(r: any) { this.selected = r; this.showPanel = true; }
  onStatus(e: {id:string;status:string}) { this.svc.updateStatus('pt', e.id, e.status).subscribe(); }
  objectKeys = Object.keys;
}
