import { Component, OnInit } from '@angular/core';
import { AppPostureService } from '../../services/app-posture.service';
@Component({ selector: 'app-ingestion', templateUrl: './ingestion.component.html' })
export class IngestionComponent implements OnInit {
  history:any[]=[]; total=0; page=1; uploading=false; result:any=null; error='';
  file:File|null=null; reportType=''; appId=''; appName=''; filterType=''; filterStatus='';
  reportTypes=[
    {value:'sast',label:'SAST — Static Analysis'},{value:'dast',label:'DAST — Dynamic Scanning'},
    {value:'sca',label:'SCA — Software Composition'},{value:'bas',label:'BAS — Breach Simulation'},
    {value:'cart',label:'CART — Readiness Test'},
    {value:'firewall_pan',label:'Firewall — Palo Alto'},{value:'firewall_fortinet',label:'Firewall — Fortinet'},
    {value:'firewall_checkpoint',label:'Firewall — Checkpoint'},
    {value:'waf',label:'WAF Configuration'},{value:'ips',label:'IPS Signatures'},
    {value:'siem',label:'SIEM / ITSM Incidents'},
    {value:'pt_external',label:'PT — External Web App'},{value:'pt_internal',label:'PT — Internal Web App'},
    {value:'pt_mobile',label:'PT — Mobile Application'},
    {value:'redteam',label:'Red Team / Threat Hunt'},{value:'audit',label:'Audit Findings (RBI/SEBI)'},
    {value:'os_compliance',label:'OS Compliance (CIS)'},{value:'db_compliance',label:'DB Compliance (CIS)'}
  ];
  constructor(private svc:AppPostureService){}
  ngOnInit(){this.load();}
  load(){const p:any={page:this.page,limit:20};if(this.filterType)p.reportType=this.filterType;if(this.filterStatus)p.status=this.filterStatus;this.svc.getIngestionHistory(p).subscribe({next:r=>{this.history=r.data||r;this.total=r.meta?.total||this.history.length;},error:()=>{}});}
  onFile(e:any){this.file=e.target.files[0]||null;}
  upload(){if(!this.file||!this.reportType){this.error='Please select a file and report type';return;}this.uploading=true;this.error='';this.result=null;const fd=new FormData();fd.append('file',this.file);fd.append('reportType',this.reportType);if(this.appId)fd.append('appId',this.appId);if(this.appName)fd.append('appName',this.appName);this.svc.uploadReport(fd).subscribe({next:r=>{this.result=r;this.uploading=false;this.file=null;this.load();},error:e=>{this.error=e.error?.error||'Upload failed. Check file format.';this.uploading=false;}});}
  statusClass(s:string){return s==='success'?'badge-low':s==='partial'?'badge-medium':s==='failed'?'badge-critical':'badge-info';}
}