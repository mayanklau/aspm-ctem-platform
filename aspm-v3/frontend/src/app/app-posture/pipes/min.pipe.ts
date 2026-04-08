import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'min' })
export class MinPipe implements PipeTransform { transform(arr: number[]): number { return Math.min(...(arr||[0])); } }