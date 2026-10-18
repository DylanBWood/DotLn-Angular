import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dotln-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<main><h1>DotLn</h1></main>',
})
export class Home {}
