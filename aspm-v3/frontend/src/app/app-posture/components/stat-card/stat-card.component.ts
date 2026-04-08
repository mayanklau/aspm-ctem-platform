import { Component, Input } from '@angular/core';
@Component({ selector: 'app-stat-card',
  template: `<div class="stat-card"><div class="stat-icon text-muted"><i class="fa" [ngClass]="icon"></i></div><div><div class="stat-value">{{value}}</div><div class="stat-label">{{label}}</div></div></div>` })
export class StatCardComponent { @Input() label=''; @Input() value:any=''; @Input() icon='fa-circle'; }
