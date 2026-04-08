import { Component, OnInit } from '@angular/core';
import { AppPostureService } from '../../services/app-posture.service';
@Component({ selector: 'app-compliance-detail', templateUrl: './compliance-detail.component.html' })
export class ComplianceDetailComponent implements OnInit {
  findings: any[] = []; total = 0; page = 1; limit = 50; loading = false;
  selected: any = null; showPanel = false;
  filters: any = { compType: 'os', complianceStatus: '', severity: '', assetId: '' };
  columns = [{"key":"severity","label":"Sev"},{"key":"control_id","label":"Control"},{"key":"control_description","label":"Description"},{"key":"compliance_status","label":"Status"},{"key":"hostname","label":"Host"},{"key":"benchmark_standard","label":"Benchmark"}];
  constructor(private svc: AppPostureService) {}
  ngOnInit() { this.load(); }
  load() { this.loading = true; this.svc.getFindings('compliance', { page: this.page, limit: this.limit, ...this.filters }).subscribe({ next: (r: any) => { this.findings = r.data; this.total = r.meta?.total ?? 0; this.loading = false; }, error: () => this.loading = false }); }
  setType(t: string) { this.filters.compType = t; this.page = 1; this.load(); }
  onFilter() { this.page = 1; this.load(); }
  onClear() { const t = this.filters.compType; this.filters = { compType: t, complianceStatus: '', severity: '', assetId: '' }; this.load(); }
  onPage(p: number) { this.page = p; this.load(); }
  onRow(r: any) { this.selected = r; this.showPanel = true; }
  onStatus(e: any) {}
  objectKeys = Object.keys;
}
