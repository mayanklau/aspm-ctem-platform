import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'sumBy' })
export class SumByPipe implements PipeTransform {
  transform(arr: any[], key: string): number { return (arr||[]).reduce((s,i)=>s+(+i[key]||0),0); }
}