import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'dotln-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<router-outlet />',
  imports: [RouterOutlet],
})
export class App {}
