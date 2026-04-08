import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppPostureService } from '../../app-posture/services/app-posture.service';
@Component({ selector: 'app-posture-cxo-widgets', templateUrl: './app-posture-widgets.component.html' })
export class AppPostureCxoWidgetsComponent implements OnInit {
  enterprise:any=null; topRisky:any[]=[]; loading=true;
  constructor(private svc:AppPostureService, private router:Router){}
  ngOnInit(){
    this.svc.getEnterpriseScores().subscribe({next:e=>{this.enterprise=e;this.loading=false;},error:()=>this.loading=false});
    this.svc.getAllScores({orderBy:'final_posture_score',order:'ASC',limit:5}).subscribe({next:r=>this.topRisky=r.data||r,error:()=>{}});
  }
  buCellBg(s:number){return s<=4?'#f8d7da':s<=7?'#fff3cd':'#d1e7dd';}
  scoreColor(s:number){return s<=4?'#dc3545':s<=7?'#fd7e14':'#198754';}
  go(path:string){this.router.navigate([path]);}
}
