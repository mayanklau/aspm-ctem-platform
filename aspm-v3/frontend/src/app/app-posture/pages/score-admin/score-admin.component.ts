import { Component, OnInit } from '@angular/core';
import { AppPostureService } from '../../services/app-posture.service';
@Component({ selector: 'app-score-admin', templateUrl: './score-admin.component.html' })
export class ScoreAdminComponent implements OnInit {
  weightages:any[]=[]; loading=false; saving=false; saved=false;
  constructor(private svc:AppPostureService){}
  ngOnInit(){this.loading=true;this.svc.getWeightages().subscribe({next:d=>{this.weightages=d;this.loading=false;},error:()=>this.loading=false});}
  save(){this.saving=true;this.svc.updateWeightages(this.weightages).subscribe({next:()=>{this.saving=false;this.saved=true;setTimeout(()=>this.saved=false,3000);},error:()=>this.saving=false});}
}