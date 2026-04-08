import { Component, Input, OnChanges } from '@angular/core';
@Component({
  selector: 'app-donut',
  template: `
    <div style="position:relative;display:inline-flex;align-items:center;justify-content:center">
      <svg [attr.width]="size" [attr.height]="size" style="transform:rotate(-90deg)">
        <circle cx="50%" cy="50%" [attr.r]="r" fill="none" stroke="#f0f0f0" [attr.stroke-width]="sw"/>
        <circle *ngFor="let s of segs" cx="50%" cy="50%" [attr.r]="r" fill="none"
          [attr.stroke]="s.color" [attr.stroke-width]="sw"
          [attr.stroke-dasharray]="circ" [attr.stroke-dashoffset]="s.offset" [attr.stroke-dasharray]="s.dash"/>
      </svg>
      <div style="position:absolute;text-align:center">
        <div [ngStyle]="{'font-size':(size*.18)+'px','font-weight':'800','color':'#1a1a24'}">{{total}}</div>
        <div [ngStyle]="{'font-size':(size*.09)+'px','color':'#999'}">total</div>
      </div>
    </div>`,
})
export class DonutComponent implements OnChanges {
  @Input() data: {label:string,value:number,color:string}[] = [];
  @Input() size = 100; @Input() sw = 14;
  r=0; circ=0; segs:any[]=[];
  get total(){ return this.data.reduce((a,b)=>a+b.value,0); }
  ngOnChanges(){
    this.r=(this.size/2)-this.sw;
    this.circ=2*Math.PI*this.r;
    let offset=0; const t=this.total||1;
    this.segs=this.data.map(d=>{
      const dash=(d.value/t)*this.circ;
      const s={...d,dash:`${dash} ${this.circ-dash}`,offset};
      offset+=this.circ-dash; return s;
    });
  }
}
