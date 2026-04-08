import { Component, Input } from '@angular/core';
@Component({ selector: 'app-score-card', templateUrl: './score-card.component.html' })
export class ScoreCardComponent {
  @Input() label = ''; @Input() value: number|null = null; @Input() sub = ''; @Input() icon = 'fa-shield';
  get cls() { if (this.value === null) return ''; return this.value <= 4 ? 'score-critical' : this.value <= 7 ? 'score-medium' : 'score-good'; }
}
