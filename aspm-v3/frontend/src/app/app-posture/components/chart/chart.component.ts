import { Component, Input, OnChanges, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
declare const Chart: any;
@Component({
  selector: 'app-chart',
  template: `<div class="chart-container" [style.height]="height+'px'"><canvas #canvas></canvas></div>`
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef;
  @Input() type = 'bar';
  @Input() labels: string[] = [];
  @Input() datasets: any[] = [];
  @Input() height = 220;
  @Input() options: any = {};
  private chart: any;

  ngAfterViewInit(){ this.build(); }
  ngOnChanges(){ if(this.chart) this.build(); }
  ngOnDestroy(){ if(this.chart) this.chart.destroy(); }

  build(){
    if(!this.canvasRef) return;
    if(this.chart){ this.chart.destroy(); }
    const defaults = {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ font:{size:11}, padding:12 } } },
      scales: this.type==='bar'||this.type==='line' ? {
        x:{ grid:{display:false}, ticks:{font:{size:10}} },
        y:{ grid:{color:'#f5f5f5'}, ticks:{font:{size:10}} }
      } : {}
    };
    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: this.type,
      data: { labels: this.labels, datasets: this.datasets },
      options: { ...defaults, ...this.options }
    });
  }
}
