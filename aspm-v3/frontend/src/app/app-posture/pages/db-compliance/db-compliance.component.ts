import { Component, OnInit } from '@angular/core';
import { AppPostureService } from '../../services/app-posture.service';
@Component({ selector: 'app-db-compliance', templateUrl: './db-compliance.component.html' })
export class DbComplianceComponent implements OnInit {
  findings:any[]=[]; total=0; page=1; limit=50; loading=false; selected:any=null; showPanel=false;
  filters:any={assetId:'',complianceStatus:'',severity:'',q:''};
  statuses=['pass','fail','not_applicable','error']; severities=['critical','high','medium','low'];
  constructor(private svc:AppPostureService){}
  ngOnInit(){this.load();}
  load(){this.loading=true;this.svc.getFindings('compliance',{page:this.page,limit:this.limit,compType:'db',...this.filters}).subscribe({next:r=>{this.findings=r.data||r;this.total=r.meta?.total||this.findings.length;this.loading=false;},error:()=>this.loading=false});}
  apply(){this.page=1;this.load();} clear(){this.filters={assetId:'',complianceStatus:'',severity:'',q:''};this.apply();}
  open(f:any){this.selected=f;this.showPanel=true;} close(){this.showPanel=false;}
  statusClass(s:string){return s==='pass'?'bg-success':s==='fail'?'bg-danger':s==='not_applicable'?'bg-secondary':'bg-warning text-dark';}
  sevClass(s:string){const m:any={critical:'bg-danger',high:'bg-warning text-dark',medium:'bg-secondary',low:'bg-success'};return m[s||'low']||'bg-secondary';}
  get pages(){return Math.ceil(this.total/this.limit);} objectKeys=Object.keys;
}