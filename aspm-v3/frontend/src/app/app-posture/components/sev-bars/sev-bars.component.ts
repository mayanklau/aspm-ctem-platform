import { Component, Input } from '@angular/core';
@Component({
  selector: 'app-sev-bars',
  template: `
    <div>
      <div class="sev-bar-row" *ngFor="let s of sevs">
        <div class="sev-bar-label">
          <span class="sev-pill" [ngClass]="'sev-'+s.key">{{s.key}}</span>
        </div>
        <div class="sev-bar-track">
          <div class="sev-bar-fill" [ngStyle]="{'width': pct(s.count)+'%','background':s.color}"></div>
        </div>
        <div class="sev-bar-count" [ngStyle]="{'color':s.color}">{{s.count}}</div>
      </div>
    </div>`,
})
export class SevBarsComponent {
  @Input() summary: any[] = [];
  sevDef = [
    {key:'critical',color:'#e53935'},{key:'high',color:'#fb8c00'},
    {key:'medium',color:'#fdd835'},{key:'low',color:'#43a047'},{key:'informational',color:'#1e88e5'}
  ];
  get sevs(){ return this.sevDef.map(d=>({...d,count:this.summary.filter(s=>s.severity===d.key).reduce((a,b)=>a+(+b.count||0),0)})).filter(s=>s.count>0); }
  get max(){ return Math.max(...this.sevs.map(s=>s.count),1); }
  pct(c:number){ return Math.round((c/this.max)*100); }
}
