import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Puts the field first and lets everything else recede around it; never a fixed width. */
@Component({
  selector: 'scene-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="deck">
      <div class="field">
        <ng-content select="[field-slot]" />
      </div>
      <div class="instruments">
        <ng-content select="[instruments-slot]" />
      </div>
      <div class="rail">
        <ng-content select="[rail-slot]" />
      </div>
      <div class="inspector">
        <ng-content select="[notice-slot]" />
        <ng-content select="[inspector-slot]" />
      </div>
    </div>
    <div class="below">
      <ng-content select="[log-slot]" />
      <ng-content select="[text-slot]" />
    </div>
  `,
  styleUrl: './scene-layout.scss',
})
export class SceneLayout {}
