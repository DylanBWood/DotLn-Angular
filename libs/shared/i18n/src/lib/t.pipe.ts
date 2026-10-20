import { Pipe, PipeTransform } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Pipe({ name: 't', standalone: true, pure: false })
export class TPipe extends TranslocoPipe implements PipeTransform {}
