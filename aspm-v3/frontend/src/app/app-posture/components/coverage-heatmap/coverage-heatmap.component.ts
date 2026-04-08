import { Component, Input, Output, EventEmitter } from '@angular/core';
@Component({ selector: 'app-coverage-heatmap', templateUrl: './coverage-heatmap.component.html' })
export class CoverageHeatmapComponent {
  @Input() heatmap: any[] = []; @Input() coveragePct = 0;
  @Output() rowClick = new EventEmitter<any>();
  cellClass(row: any) { if (!row.assessed) return 'hm-cell'; const s = row.norm_score; if (s === null) return 'hm-cell'; return s <= 4 ? 'hm-cell hm-cell-red' : s <= 7 ? 'hm-cell hm-cell-amber' : 'hm-cell hm-cell-green'; }
}
