import type { ParamSpec, TransformKind } from '@dotln-angular/models';
import type {
  RouteReading,
  SlotAssignment,
  StepPreview,
  StepRefusal,
  UnitFrame,
} from '@dotln-angular/scene-engine';
import { length, travelWeightParams } from '@dotln-angular/scene-engine';

import type {
  InspectorCost,
  InspectorIssue,
  InspectorParam,
  InspectorPreview,
  InspectorRoutes,
  InspectorView,
  SlotTableView,
} from '../models/scene-view-model';
import type { SceneUnitStyle } from '../renderers/scene-renderer';
import { workColour } from './rail-mapper';
import {
  isCostParam,
  needsObjective,
  paramChoices,
  type SceneTool,
  selectionProblem,
  stepSize,
} from './tool-mapper';

const readable = (value: string) => value.replace(/[.-]/g, ' ');

export interface InspectorInput {
  readonly tool: SceneTool;
  readonly definition?: string;
  readonly mixedSpeed?: boolean;
  readonly cueTempo?: boolean;
  readonly params: Readonly<Record<string, number>>;
  readonly selectionCount: number;
  readonly objectiveSet: boolean;
  /** What applying the tool now would do, when that is shown. */
  readonly preview: StepPreview | null;
  /** Why the engine would refuse the tool, which holds Apply back whether or not it is shown. */
  readonly refusal: StepRefusal | null;
  /** The slots to list: the formation's own once it stands, otherwise the preview's. */
  readonly slots: readonly SlotAssignment[];
  /** Whether those are slots units are actually taking, not ones Apply would fill. */
  readonly slotsLive: boolean;
  readonly units: readonly UnitFrame[];
  readonly styles: readonly SceneUnitStyle[];
  /** The search displayed on the field, either recorded routes or an Apply preview. */
  readonly routes: { readonly readings: readonly RouteReading[]; readonly live: boolean } | null;
  readonly transformLabel: (kind: TransformKind) => string;
  readonly faceLabel?: (token: string) => string | undefined;
  readonly choiceLabel: (name: string) => string;
  readonly paramWords?: (name: string) => string | undefined;
}

function mapFaces({ tool, transformLabel, faceLabel }: InspectorInput): InspectorView['faces'] {
  const { selection, scene, observable, toyMetric, transform } = tool.faces;
  const label = (token: string) => faceLabel?.(token) ?? readable(token);
  return {
    minimum: selection.min,
    maximum: selection.max,
    squad: selection.target === 'squad',
    transform: transformLabel(transform.kind),
    scenes: scene.map(label).join(', '),
    observable: observable.map(label).join(', '),
    metrics: toyMetric.map(label).join(', '),
  };
}

function mapIssue({ tool, selectionCount, objectiveSet }: InspectorInput): InspectorIssue | null {
  const { min, max } = tool.faces.selection;
  const code = selectionProblem(tool, selectionCount);
  if (code !== null) return { code, min, max };
  return needsObjective(tool) && !objectiveSet ? { code: 'objective', min, max } : null;
}

function mapPreview({ preview }: InspectorInput): InspectorPreview | null {
  if (preview === null) return null;
  const strongest = Math.max(0, ...preview.arrows.map(({ acceleration }) => length(acceleration)));
  return {
    units: preview.arrows.length,
    strongest: strongest.toFixed(1),
    quiet: strongest === 0,
  };
}

// A unit still on its way, or held up short of its place, is the only one not in it. A fixed
// formation's leader has no slot to reach, only an order of its own to finish.
const inPlace = (unit: UnitFrame | undefined) =>
  unit !== undefined && unit.activity !== 'moving' && unit.activity !== 'stalled';

function mapSlots({ slots, slotsLive, units, styles }: InspectorInput): SlotTableView | null {
  if (slots.length === 0) return null;
  const labels = new Map(styles.map(({ id, label }) => [id, label]));
  const frames = new Map(units.map((unit) => [unit.id, unit]));
  const rows = slots.map((slot) => ({
    ...slot,
    label: labels.get(slot.unitId) ?? slot.unitId,
    number: slot.slot + 1,
    inPlace: slotsLive && inPlace(frames.get(slot.unitId)),
  }));
  return {
    rows,
    live: slotsLive,
    placed: rows.filter((row) => row.inPlace).length,
    totalCost: slots.reduce((sum, { cost }) => sum + cost, 0),
  };
}

const tenths = (value: number) => value.toFixed(1);

/** The route the inspector reads out: the first with a search to show, else the first. */
export const readRoute = (routes: readonly RouteReading[]): RouteReading | undefined =>
  routes.find(({ route }) => route.search !== null) ?? routes[0];

function mapRoutes(input: InspectorInput): InspectorRoutes | null {
  if (!input.routes) return null;
  const { readings: routes, live } = input.routes;
  const { objectiveSet, styles } = input;
  const following = routes.filter(({ route }) => route.status === 'following');
  const lengths = following.flatMap(({ length }) => (length === null ? [] : [length]));
  const first = readRoute(routes);
  const label = styles.find(({ id }) => id === first?.id)?.label;
  const ahead =
    first?.route.status === 'following' ? first.route.waypoints[first.route.next] : null;
  return {
    live,
    following: following.length,
    blocked: routes.length - following.length,
    length:
      lengths.length === 0
        ? null
        : tenths(lengths.reduce((sum, length) => sum + length, 0) / lengths.length),
    unit: first === undefined ? null : `${label ?? first.id} ${first.id}`,
    expansions: first?.route.search?.expansions ?? null,
    waypoint: ahead ? `(${tenths(ahead.x)}, ${tenths(ahead.y)})` : null,
    objective: objectiveSet,
  };
}

// The engine's weights that scale every edge's length alike; the rest weigh cost layers.
function mapCost({ tool, params }: InspectorInput): InspectorCost | null {
  const { kind, params: specs } = tool.faces.transform;
  if (kind !== 'path.cost') return null;
  const travel = specs.filter(({ name }) => travelWeightParams.includes(name));
  const weight = travel.reduce((product, spec) => product * (params[spec.name] ?? spec.default), 1);
  return {
    travelWeight: travel.length === 0 ? null : String(Math.round(weight * 100) / 100),
    layers: specs.some(({ name }) => !travelWeightParams.includes(name)),
  };
}

function mapParam(spec: ParamSpec, input: InspectorInput): InspectorParam {
  const value = input.params[spec.name] ?? spec.default;
  return {
    name: spec.name,
    mixed: spec.name === 'bullet-speed' && input.mixedSpeed === true,
    label: input.paramWords?.(spec.name) ?? readable(spec.name),
    value,
    min: spec.min,
    max: spec.max,
    step: stepSize(spec),
    unit: input.paramWords?.(spec.unit) ?? readable(spec.unit),
    choices: paramChoices(spec).map((choice) => ({
      value: choice.value,
      label: input.choiceLabel(choice.name),
      chosen: choice.value === value,
    })),
  };
}

export function mapInspector(input: InspectorInput): InspectorView {
  const { tool, refusal } = input;
  const specs = tool.faces.transform.params;
  const issue = mapIssue(input);
  return {
    title: tool.title,
    targets:
      tool.faces.transform.kind === 'combat.fire'
        ? {
            selected: input.params['target'] ?? 0,
            options: input.units.map((unit, index) => ({
              value: index + 1,
              id: unit.id,
              label: input.styles.find((style) => style.id === unit.id)?.label ?? '',
              down: unit.activity === 'down',
            })),
          }
        : undefined,
    shot: input.preview?.shot,
    cueTempo: input.cueTempo === true,
    colour: workColour(tool),
    definition: input.definition ?? tool.definition,
    faces: mapFaces(input),
    params: specs.filter((spec) => !isCostParam(spec)).map((spec) => mapParam(spec, input)),
    costs: specs.filter(isCostParam).map((spec) => mapParam(spec, input)),
    preview: mapPreview(input),
    slots: mapSlots(input),
    routes: mapRoutes(input),
    cost: mapCost(input),
    issue,
    canApply: issue === null && refusal === null,
  };
}
