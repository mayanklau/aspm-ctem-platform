import { Component, OnInit } from '@angular/core';
import { AppPostureService } from '../../services/app-posture.service';
@Component({ selector: 'app-firewall-detail', templateUrl: './firewall-detail.component.html' })
export class FirewallDetailComponent implements OnInit {
  rules:any[]=[]; total=0; page=1; limit=100; loading=false; summary:any[]=[]; selected:any=null; showPanel=false;
  filters:any={vendor:'',riskType:'',action:''};
  vendors=['palo_alto','fortinet','checkpoint']; actions=['allow','accept','deny','drop','reject'];
  constructor(private svc:AppPostureService){}
  ngOnInit(){this.load();this.svc.getFirewallSummary().subscribe({next:d=>this.summary=d,error:()=>{}});}
  load(){this.loading=true;this.svc.getFindings('firewall',{page:this.page,limit:this.limit,...this.filters}).subscribe({next:r=>{this.rules=r.data||r;this.total=r.meta?.total||this.rules.length;this.loading=false;},error:()=>this.loading=false});}
  apply(){this.page=1;this.load();} clear(){this.filters={vendor:'',riskType:'',action:''};this.apply();}
  open(r:any){this.selected=r;this.showPanel=true;} close(){this.showPanel=false;}
  riskClass(r:any){return r.risk_score>5?'row-critical':r.risk_score>2?'row-high':'';}
  get summaryLabels(){return this.summary.map(s=>s.vendor||'unknown');}
  get summaryDatasets(){return [{label:'Permissive',data:this.summary.map(s=>+s.permissive_count),backgroundColor:'#e53935',borderRadius:4},{label:'No Logging',data:this.summary.map(s=>+s.no_log_count),backgroundColor:'#fb8c00',borderRadius:4},{label:'Undocumented',data:this.summary.map(s=>+s.undocumented_count||0),backgroundColor:'#fdd835',borderRadius:4}];}
  get pages(){return Math.ceil(this.total/this.limit);}
  exportCsv(){const rows=this.rules.map(r=>`${r.rule_num},${r.vendor},${r.rule_name||''},${r.source},${r.destination},${r.action},${r.risk_score},${r.log_enabled}`);const csv=['#,Vendor,Name,Source,Destination,Action,Risk,Log',...rows].join('\n');const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='firewall_rules.csv';a.click();}
  objectKeys=Object.keys;
}