import { Component, Input } from '@angular/core';
@Component({
  selector: 'app-posture-gauge',
  template: `
    <div class="text-center">
      <div class="d-inline-flex flex-column align-items-center justify-content-center rounded-circle border"
           [ngStyle]="{'border-width':'6px','border-color':color,'width':'90px','height':'90px'}">
        <span class="fw-bold fs-3" [ngStyle]="{'color':color}">{{score | number:'1.1-1'}}</span>
        <span class="small text-muted" style="font-size:.65rem">/10</span>
      </div>
      <div class="mt-1 small fw-bold" [ngStyle]="{'color':color}">{{label}}</div>
    </div>`
})
export class PostureGaugeComponent {
  @Input() score: number = 0;
  get color() { return this.score <= 4 ? '#dc3545' : this.score <= 7 ? '#fd7e14' : '#198754'; }
  get label() { return this.score <= 4 ? 'High Risk' : this.score <= 7 ? 'Medium Risk' : 'Low Risk'; }
}
