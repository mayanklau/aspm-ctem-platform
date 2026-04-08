import { Component, OnInit } from '@angular/core';
import { AppPostureService } from '../../services/app-posture.service';
@Component({ selector: 'app-pt-internal', templateUrl: './pt-internal.component.html' })
export class PtInternalComponent implements OnInit {
  findings:any[]=[]; total=0; page=1; limit=50; loading=false; summary:any[]=[]; selected:any=null; showPanel=false;
  filters:any={appId:'',severity:'',status:'',q:''};
  severities=['critical','high','medium','low','informational']; statuses=['open','in_progress','resolved','accepted_risk'];
  constructor(private svc:AppPostureService){}
  ngOnInit(){this.load();this.loadSummary();}
  load(){this.loading=true;this.svc.getFindings('pt',{page:this.page,limit:this.limit,ptType:'internal_webapp',...this.filters}).subscribe({next:r=>{this.findings=r.data||r;this.total=r.meta?.total||this.findings.length;this.loading=false;},error:()=>this.loading=false});}
  loadSummary(){this.svc.getSummary('pt',{appId:this.filters.appId}).subscribe({next:d=>this.summary=d,error:()=>{}});}
  apply(){this.page=1;this.load();} clear(){this.filters={appId:'',severity:'',status:'',q:''};this.apply();}
  open(f:any){this.selected=f;this.showPanel=true;} close(){this.showPanel=false;}
  updateStatus(id:string,s:string){this.svc.updateStatus('pt',id,s).subscribe({next:()=>this.load()});}
  sevClass(s:string){const m:any={critical:'badge-critical',high:'badge-high',medium:'badge-medium',low:'badge-low',informational:'badge-info'};return 'risk-badge '+(m[(s||'low').toLowerCase()]||'badge-low');}
  totalFor(sev:string){return this.summary.filter(s=>s.severity===sev).reduce((a,b)=>a+(+b.count||0),0);}
  get sevLabels(){return['Critical','High','Medium','Low'];}
  get sevDatasets(){return[{data:[this.totalFor('critical'),this.totalFor('high'),this.totalFor('medium'),this.totalFor('low')],backgroundColor:['#e53935','#fb8c00','#fdd835','#43a047'],borderRadius:6,borderSkipped:false}];}
  get pages(){return Math.ceil(this.total/this.limit);} objectKeys=Object.keys;
}