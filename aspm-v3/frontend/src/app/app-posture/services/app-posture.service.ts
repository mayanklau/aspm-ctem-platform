import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppPostureService {
  private base = environment.apiUrl;
  constructor(private http: HttpClient) {}

  private p(o: any = {}): HttpParams {
    let p = new HttpParams();
    Object.entries(o).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v)); });
    return p;
  }

  getFindings(type: string, q: any = {}): Observable<any> {
    return this.http.get<any>(`${this.base}/reports/${type}`, { params: this.p(q) }).pipe(map(r => r.data ?? r));
  }
  getSummary(type: string, q: any = {}): Observable<any> {
    return this.http.get<any>(`${this.base}/reports/${type}/summary`, { params: this.p(q) }).pipe(map(r => r.data ?? r));
  }
  updateStatus(type: string, id: string, status: string): Observable<any> {
    return this.http.patch(`${this.base}/reports/${type}/${id}/status`, { status });
  }
  getFirewallSummary(): Observable<any> {
    return this.http.get<any>(`${this.base}/reports/firewall/summary`).pipe(map(r => r.data ?? r));
  }
  getSiemKillChain(): Observable<any> {
    return this.http.get<any>(`${this.base}/reports/siem/killchain`).pipe(map(r => r.data ?? r));
  }
  uploadReport(fd: FormData): Observable<any> {
    return this.http.post<any>(`${this.base}/reports/upload`, fd).pipe(map(r => r.data ?? r));
  }
  getIngestionHistory(q: any = {}): Observable<any> {
    return this.http.get<any>(`${this.base}/reports/ingestion-history`, { params: this.p(q) }).pipe(map(r => r.data ?? r));
  }
  getApplicationScore(appId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/scores/application/${appId}`).pipe(map(r => r.data ?? r));
  }
  recomputeScore(appId: string): Observable<any> {
    return this.http.post<any>(`${this.base}/scores/application/${appId}/compute`, {}).pipe(map(r => r.data ?? r));
  }
  getAllScores(q: any = {}): Observable<any> {
    return this.http.get<any>(`${this.base}/scores/applications`, { params: this.p(q) }).pipe(map(r => r.data ?? r));
  }
  getEnterpriseScores(): Observable<any> {
    return this.http.get<any>(`${this.base}/scores/enterprise`).pipe(map(r => r.data ?? r));
  }
  getCoverageHeatmap(appId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/scores/coverage`, { params: this.p({ appId }) }).pipe(map(r => r.data ?? r));
  }
  getWeightages(): Observable<any[]> {
    return this.http.get<any>(`${this.base}/scores/weightages`).pipe(map(r => r.data ?? r));
  }
  updateWeightages(w: any[]): Observable<any> {
    return this.http.put(`${this.base}/scores/weightages`, w);
  }
  getIntegrations(): Observable<any[]> {
    return this.http.get<any>(`${this.base}/integrations`).pipe(map(r => r.data ?? r));
  }
  createIntegration(d: any): Observable<any> { return this.http.post(`${this.base}/integrations`, d); }
  updateIntegration(id: string, d: any): Observable<any> { return this.http.put(`${this.base}/integrations/${id}`, d); }
  deleteIntegration(id: string): Observable<any> { return this.http.delete(`${this.base}/integrations/${id}`); }
  triggerSync(id: string): Observable<any> { return this.http.post(`${this.base}/integrations/${id}/sync`, {}); }
  testConnection(d: any): Observable<any> { return this.http.post(`${this.base}/integrations/test-connection`, d); }
}
  getScoreTrend(appId: string, months = 12): Observable<any> {
    return this.http.get<any>(`${this.base}/scores/application/${appId}/trend`, { params: this.p({ months }) }).pipe(map(r => r.data ?? r));
  }
