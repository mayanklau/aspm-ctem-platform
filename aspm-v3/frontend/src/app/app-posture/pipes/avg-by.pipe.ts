import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'avgBy' })
export class AvgByPipe implements PipeTransform {
  transform(arr: any[], key: string): number { if(!arr?.length) return 0; return (arr||[]).reduce((s,i)=>s+(+i[key]||0),0)/arr.length; }
}