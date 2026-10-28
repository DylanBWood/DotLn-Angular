import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { translateSignal } from '@dotln-angular/i18n';
import type { Tool, ToolId } from '@dotln-angular/models';
import { HookDomain, isSceneTool, TransformKind } from '@dotln-angular/models';

import { ConceptReading } from '../../composites/concept-reading/concept-reading';
import type { ReadingView } from '../../types';
import { mapHookDomains } from '../hook-domain-mapper/hook-domain-mapper';

export const readable = (value: string) => value.replace(/[.-]/g, ' ');
export const mapReading = (
  tool: Tool,
  transform: string,
  target: string,
  domains: Readonly<Record<HookDomain, string>>,
): ReadingView => ({
  tool,
  place: [tool.place.part, tool.place.chapter, tool.place.section, tool.place.subsection]
    .filter(Boolean)
    .join(' · '),
  relations: tool.related,
  hooks: mapHookDomains(tool.hooks, domains),
  faces:
    tool.status === 'typed'
      ? {
          scenes: tool.faces.scene.map(readable).join(', '),
          target,
          minimum: tool.faces.selection.min,
          maximum: tool.faces.selection.max,
          transform,
          observable: tool.faces.observable.map(readable).join(', '),
          metrics: tool.faces.toyMetric.map(readable).join(', '),
          params: tool.faces.transform.params.map((param) => ({
            ...param,
            name: readable(param.name),
            unit: readable(param.unit),
          })),
        }
      : null,
  sceneTool: isSceneTool(tool),
});

@Component({
  selector: 'tools-reading-mapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tools-concept-reading [reading]="vm()" (followed)="followed.emit($event)"><ng-content /></tools-concept-reading>
  `,
  imports: [ConceptReading],
})
export class ReadingMapper {
  readonly tool = input.required<Tool>();
  readonly followed = output<ToolId>();
  readonly #targets = {
    unit: {
      one: translateSignal('tools.targets.unit'),
      many: translateSignal('tools.targets.units'),
    },
    squad: {
      one: translateSignal('tools.targets.squad'),
      many: translateSignal('tools.targets.squads'),
    },
    commander: {
      one: translateSignal('tools.targets.commander'),
      many: translateSignal('tools.targets.commanders'),
    },
    channel: {
      one: translateSignal('tools.targets.channel'),
      many: translateSignal('tools.targets.channels'),
    },
    region: {
      one: translateSignal('tools.targets.region'),
      many: translateSignal('tools.targets.regions'),
    },
    scene: {
      one: translateSignal('tools.targets.scene'),
      many: translateSignal('tools.targets.scenes'),
    },
  };
  readonly #domains = {
    [HookDomain.Planning]: translateSignal('tools.domains.D1'),
    [HookDomain.OrderLifecycle]: translateSignal('tools.domains.D2'),
    [HookDomain.GateAndHarness]: translateSignal('tools.domains.D3'),
    [HookDomain.RecordsAndProjections]: translateSignal('tools.domains.D4'),
    [HookDomain.Publication]: translateSignal('tools.domains.D5'),
    [HookDomain.KitAndInstances]: translateSignal('tools.domains.D6'),
    [HookDomain.ConsoleAndUiHosts]: translateSignal('tools.domains.D7'),
    [HookDomain.FeedbackCompiler]: translateSignal('tools.domains.D8'),
    [HookDomain.OperatorWorkflow]: translateSignal('tools.domains.D9'),
    [HookDomain.InstanceWork]: translateSignal('tools.domains.D10'),
    [HookDomain.AgentBehaviour]: translateSignal('tools.domains.D11'),
  };
  readonly #transforms = {
    [TransformKind.SteerBlend]: translateSignal('tools.transforms.blend'),
    [TransformKind.SteerPriority]: translateSignal('tools.transforms.priority'),
    [TransformKind.FormationTwoLevel]: translateSignal('tools.transforms.twoLevel'),
    [TransformKind.FormationFixed]: translateSignal('tools.transforms.fixed'),
    [TransformKind.ObjectiveSet]: translateSignal('tools.transforms.objective'),
    [TransformKind.SquadForm]: translateSignal('tools.transforms.form'),
    [TransformKind.SquadDissolve]: translateSignal('tools.transforms.dissolve'),
    [TransformKind.OrderIssue]: translateSignal('tools.transforms.order'),
    [TransformKind.ChannelPolicy]: translateSignal('tools.transforms.channel'),
    [TransformKind.GroundInfluence]: translateSignal('tools.transforms.influence'),
    [TransformKind.GroundFrag]: translateSignal('tools.transforms.frag'),
    [TransformKind.PathCost]: translateSignal('tools.transforms.path'),
    [TransformKind.LevelZoom]: translateSignal('tools.transforms.zoom'),
    [TransformKind.LevelRing]: translateSignal('tools.transforms.ring'),
  };
  readonly vm = computed(() => {
    const tool = this.tool();
    const domains = Object.fromEntries(
      Object.entries(this.#domains).map(([key, value]) => [key, value()]),
    ) as Record<HookDomain, string>;
    return mapReading(
      tool,
      tool.status === 'typed' ? this.#transforms[tool.faces.transform.kind]() : '',
      tool.status === 'typed'
        ? this.#targets[tool.faces.selection.target][
            tool.faces.selection.max === 1 ? 'one' : 'many'
          ]()
        : '',
      domains,
    );
  });
}
