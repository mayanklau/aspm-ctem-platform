import { Component, OnInit } from '@angular/core';
import { AppPostureService } from '../../services/app-posture.service';
@Component({ selector: 'app-siem-detail', templateUrl: './siem-detail.component.html' })
export class SiemDetailComponent implements OnInit {
  incidents:any[]=[]; total=0; page=1; limit=50; loading=false;
  killChain:any[]=[]; selected:any=null; showPanel=false;
  filters:any={priority:'',slaBreached:'',toBeBlocked:'',q:''};
  priorities=['Critical','High','Medium','Low'];
  constructor(private svc:AppPostureService){}
  ngOnInit(){this.load();this.loadKc();}
  load(){this.loading=true;this.svc.getFindings('siem',{page:this.page,limit:this.limit,...this.filters}).subscribe({next:r=>{this.incidents=r.data||r;this.total=r.meta?.total||this.incidents.length;this.loading=false;},error:()=>this.loading=false});}
  loadKc(){this.svc.getSiemKillChain().subscribe({next:d=>this.killChain=d,error:()=>{}});}
  apply(){this.page=1;this.load();} clear(){this.filters={priority:'',slaBreached:'',toBeBlocked:'',q:''};this.apply();}
  open(i:any){this.selected=i;this.showPanel=true;} close(){this.showPanel=false;}
  priClass(p:string){const m:any={Critical:'badge-critical',High:'badge-high',Medium:'badge-medium',Low:'badge-low'};return 'risk-badge '+(m[p]||'badge-low');}
  get kcLabels(){return this.killChain.map(k=>k.kill_chain||'Unknown');}
  get kcDatasets(){return [{data:this.killChain.map(k=>+k.count),backgroundColor:'#2e5bff',borderRadius:6,label:'Incidents'},{data:this.killChain.map(k=>+k.sla_breached_count),backgroundColor:'#e53935',borderRadius:6,label:'SLA Breached'}];}
  get pages(){return Math.ceil(this.total/this.limit);}
  exportCsv(){const rows=this.incidents.map(i=>`${i.incident_id},${i.title||i.incident_summary},${i.priority},${i.kill_chain||''},${i.risk_score},${i.sla_breached},${i.to_be_blocked}`);const csv=['ID,Title,Priority,Kill Chain,Risk,SLA Breached,To Block',...rows].join('\n');const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='siem_incidents.csv';a.click();}
  objectKeys=Object.keys;
}