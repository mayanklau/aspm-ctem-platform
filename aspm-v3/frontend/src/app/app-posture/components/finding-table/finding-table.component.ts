import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
@Component({ selector: 'app-finding-table', templateUrl: './finding-table.component.html' })
export class FindingTableComponent implements OnChanges {
  @Input() findings: any[] = []; @Input() total = 0; @Input() page = 1; @Input() limit = 50; @Input() loading = false;
  @Input() columns: {key:string;label:string;pipe?:string}[] = [];
  @Output() rowClick = new EventEmitter<any>(); @Output() pageChange = new EventEmitter<number>(); @Output() statusChange = new EventEmitter<{id:string;status:string}>();
  pages: number[] = [];
  ngOnChanges() { const p = Math.ceil(this.total / this.limit); this.pages = Array.from({length:Math.min(p,10)},(_,i)=>i+1); }
  get(row: any, key: string) { return key.split('.').reduce((o,k)=>o?.[k], row) ?? '—'; }
  sevClass(s: string) { const m:any={critical:'badge-danger',high:'badge-warning',medium:'badge-info',low:'badge-secondary',informational:'badge-light'}; return 'badge ' + (m[s?.toLowerCase()]||'badge-secondary'); }
}
