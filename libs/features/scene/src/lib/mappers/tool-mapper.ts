import type { ParamSpec, Tool, ToolId, TransformKind, TypedTransform } from '@dotln-angular/models';
import type { CompositionStep, UnitId } from '@dotln-angular/scene-engine';
import { isInterpretedKind } from '@dotln-angular/scene-engine';

import type { RailGroupId } from '../models/scene-view-model';

/** A catalog tool with a typed transform, narrowed so that transform can be read directly. */
export type SceneTool = Tool & { readonly status: 'typed' };

export const railGroupOrder: readonly RailGroupId[] = ['move', 'group', 'avoid', 'form'];

/** The tool whose patterns the rail lists by name: wedge, line and column. */
export const patternToolId: ToolId = 'aifg-a:177';

/** The tool a right-click gives the selected units along with the objective. */
export const arriveToolId: ToolId = 'aifg-a:112';

const groupParams = [
  'separation-weight',
  'cohesion-weight',
  'velocity-match-weight',
  'alignment-weight',
];

export const isTypedTool = (tool: Tool): tool is SceneTool => tool.status === 'typed';

/** The one test every list in the scene passes through: does the engine run this tool? */
export const isRunnable = (tool: Tool): tool is SceneTool =>
  isTypedTool(tool) && isInterpretedKind(tool.faces.transform.kind);

const paramNames = (tool: SceneTool) => tool.faces.transform.params.map(({ name }) => name);

export function railGroupOf(tool: SceneTool): RailGroupId {
  const { kind } = tool.faces.transform;
  if (kind === 'formation.twoLevel' || kind === 'formation.fixed') return 'form';
  if (kind === 'steer.priority') return 'avoid';
  const names = paramNames(tool);
  if (names.includes('avoidance-weight')) return 'avoid';
  return names.some((name) => groupParams.includes(name)) ? 'group' : 'move';
}

export const defaultParams = (transform: TypedTransform) =>
  Object.fromEntries(transform.params.map(({ name, default: value }) => [name, value]));

export const isCostParam = (param: ParamSpec) => param.name.startsWith('cost.');

export interface ParamChoice {
  readonly value: number;
  readonly name: string;
}

/** A parameter that names its values, such as `0 wedge; 1 line; 2 column`, as its choices. */
export function paramChoices(param: ParamSpec): readonly ParamChoice[] {
  if (!param.unit.includes(';')) return [];
  return param.unit.split(';').flatMap((entry) => {
    const match = /^\s*(\d+)\s+(.+?)\s*$/.exec(entry);
    return match ? [{ value: Number(match[1]), name: match[2] }] : [];
  });
}

/** The tool's formation patterns, or none when it has no pattern parameter. */
export function patternsOf(tool: SceneTool) {
  const param = tool.faces.transform.params.find(({ name }) => name === 'pattern');
  return param ? paramChoices(param) : [];
}

export const stepSize = (param: ParamSpec) =>
  param.unit === 'rank' || param.unit === 'cost' ? 1 : (param.max - param.min) / 100;

/** Whether a tool's steering waits on an objective, so it stays silent without one. */
export const needsObjective = (tool: SceneTool) =>
  paramNames(tool).some((name) => name === 'seek-weight' || name === 'arrive-weight');

/** The selection's problem for this tool, if any; a squad is whatever is selected, as one. */
export function selectionProblem(
  tool: SceneTool,
  count: number,
): 'empty' | 'too-few' | 'too-many' | null {
  const { target, min, max } = tool.faces.selection;
  if (count === 0) return 'empty';
  if (target === 'squad') return null;
  if (count < min) return 'too-few';
  return max !== null && count > max ? 'too-many' : null;
}

/** A catalog tool, with the operator's parameters, as the step the engine folds in. */
export function mapToolToStep(
  tool: SceneTool,
  params: Readonly<Record<string, number>>,
  selection: readonly UnitId[],
  at: number,
): CompositionStep {
  return {
    at,
    toolId: tool.id,
    kind: tool.faces.transform.kind satisfies TransformKind,
    selection,
    params,
  };
}
