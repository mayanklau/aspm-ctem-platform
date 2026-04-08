import { Component, Input } from '@angular/core';
@Component({
  selector: 'app-severity-badge',
  template: `<span class="badge" [ngClass]="cls">{{severity | titlecase}}</span>`
})
export class SeverityBadgeComponent {
  @Input() severity: string = 'low';
  get cls() {
    const m: any = { critical:'bg-danger', high:'bg-warning text-dark', medium:'bg-warning text-dark', low:'bg-secondary', informational:'bg-info text-dark' };
    return m[this.severity?.toLowerCase()] || 'bg-secondary';
  }
}
