import { Component, OnInit } from '@angular/core';
import { AppPostureService } from '../../services/app-posture.service';
@Component({ selector: 'app-integrations', templateUrl: './integrations.component.html' })
export class IntegrationsComponent implements OnInit {
  integrations:any[]=[]; loading=false; showForm=false; editId='';
  syncing:any={}; testResult:any=null; testLoading=false;
  form:any={name:'',report_type:'',tool:'',endpoint_url:'',auth_type:'api_key',credentials:{api_key:''},poll_interval:'daily',enabled:true};
  reportTypes=['sast','dast','sca','bas','cart','firewall','waf','ips','siem','pt_external','pt_internal','pt_mobile','redteam','audit','os_compliance','db_compliance'];
  templates=[
    {name:'SonarQube',report_type:'sast',tool:'SonarQube',endpoint_url:'https://sonarqube.yourbank.com/api/issues/search',auth_type:'bearer',poll_interval:'daily'},
    {name:'OWASP ZAP',report_type:'dast',tool:'OWASP ZAP',endpoint_url:'http://zap.yourbank.com/JSON/alert/view/alerts/',auth_type:'api_key',poll_interval:'daily'},
    {name:'Snyk',report_type:'sca',tool:'Snyk',endpoint_url:'https://api.snyk.io/v1/org/YOUR_ORG/projects',auth_type:'bearer',poll_interval:'daily'},
    {name:'Cymulate BAS',report_type:'bas',tool:'Cymulate',endpoint_url:'https://api.cymulate.com/v1/assessments',auth_type:'api_key',poll_interval:'weekly'},
    {name:'IBM QRadar',report_type:'siem',tool:'QRadar',endpoint_url:'https://qradar.yourbank.com/api/siem/offenses',auth_type:'bearer',poll_interval:'hourly'},
    {name:'Palo Alto XSOAR',report_type:'siem',tool:'Cortex XSOAR',endpoint_url:'https://xsoar.yourbank.com/api/v2/incidents',auth_type:'api_key',poll_interval:'hourly'},
    {name:'Splunk ES',report_type:'siem',tool:'Splunk',endpoint_url:'https://splunk.yourbank.com:8089/services/search/jobs',auth_type:'bearer',poll_interval:'hourly'},
    {name:'Fortinet FortiManager',report_type:'firewall',tool:'FortiManager',endpoint_url:'https://fortimanager.yourbank.com/jsonrpc',auth_type:'api_key',poll_interval:'weekly'},
    {name:'Tenable.io',report_type:'sast',tool:'Tenable',endpoint_url:'https://cloud.tenable.com/workbenches/assets/vulnerabilities',auth_type:'api_key',poll_interval:'daily'},
  ];
  constructor(private svc:AppPostureService){}
  ngOnInit(){this.load();}
  load(){this.loading=true;this.svc.getIntegrations().subscribe({next:d=>{this.integrations=d;this.loading=false;},error:()=>this.loading=false});}
  openForm(c?:any){if(c){this.editId=c.id;this.form={...c,credentials:{}};}else{this.editId='';this.form={name:'',report_type:'',tool:'',endpoint_url:'',auth_type:'api_key',credentials:{api_key:''},poll_interval:'daily',enabled:true};}this.showForm=true;this.testResult=null;}
  useTemplate(t:any){this.form={...this.form,...t,credentials:{api_key:''},enabled:true};}
  closeForm(){this.showForm=false;}
  save(){const o=this.editId?this.svc.updateIntegration(this.editId,this.form):this.svc.createIntegration(this.form);o.subscribe({next:()=>{this.closeForm();this.load();},error:()=>{}});}
  delete(id:string){if(confirm('Delete this integration?'))this.svc.deleteIntegration(id).subscribe(()=>this.load());}
  sync(id:string){this.syncing[id]=true;this.svc.triggerSync(id).subscribe({next:()=>setTimeout(()=>{this.syncing[id]=false;this.load();},2000),error:()=>this.syncing[id]=false});}
  test(){this.testLoading=true;this.svc.testConnection(this.form).subscribe({next:r=>{this.testResult=r;this.testLoading=false;},error:e=>{this.testResult={success:false,error:e.message};this.testLoading=false;}});}
  stsClass(s:string){return s==='success'?'text-success':s==='failed'?'text-danger':s==='running'?'text-warning':'text-muted';}
}