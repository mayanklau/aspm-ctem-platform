import { Component, Input, OnChanges } from '@angular/core';
@Component({
  selector: 'app-gauge',
  template: `
    <div class="gauge-wrap" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.width]="size" [attr.height]="size" class="gauge-ring">
        <circle class="gauge-bg" [attr.cx]="cx" [attr.cy]="cy" [attr.r]="r" [attr.stroke-width]="sw"/>
        <circle class="gauge-fill" [attr.cx]="cx" [attr.cy]="cy" [attr.r]="r"
          [attr.stroke]="color" [attr.stroke-width]="sw"
          [attr.stroke-dasharray]="circ" [attr.stroke-dashoffset]="offset"/>
      </svg>
      <div class="gauge-text">
        <div class="gv" [ngStyle]="{'color':color,'font-size': (size*0.22)+'px'}">{{score | number:'1.1-1'}}</div>
        <div class="gl" [ngStyle]="{'font-size':(size*0.08)+'px'}">{{label}}</div>
      </div>
    </div>`,
})
export class GaugeComponent implements OnChanges {
  @Input() score = 0;
  @Input() size = 120;
  @Input() label = '/10';
  cx=60; cy=60; r=50; sw=10; circ=0; offset=0;
  get color(){ return this.score<=4?'#e53935':this.score<=7?'#fb8c00':'#2e7d32'; }
  ngOnChanges(){ this.cx=this.size/2; this.cy=this.size/2; this.r=(this.size/2)-this.sw; this.circ=2*Math.PI*this.r; this.offset=this.circ-(this.score/10)*this.circ; }
}
