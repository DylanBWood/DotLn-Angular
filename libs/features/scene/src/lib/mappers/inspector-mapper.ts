import type { ParamSpec, TransformKind } from '@dotln-angular/models';
import type {
  SlotAssignment,
  StepPreview,
  StepRefusal,
  UnitFrame,
} from '@dotln-angular/scene-engine';
import { length } from '@dotln-angular/scene-engine';

import type {
  InspectorIssue,
  InspectorParam,
  InspectorPreview,
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
  readonly transformLabel: (kind: TransformKind) => string;
  readonly choiceLabel: (name: string) => string;
}

function mapFaces({ tool, transformLabel }: InspectorInput): InspectorView['faces'] {
  const { selection, scene, observable, toyMetric, transform } = tool.faces;
  return {
    minimum: selection.min,
    maximum: selection.max,
    squad: selection.target === 'squad',
    transform: transformLabel(transform.kind),
    scenes: scene.map(readable).join(', '),
    observable: observable.map(readable).join(', '),
    metrics: toyMetric.map(readable).join(', '),
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

function mapParam(spec: ParamSpec, input: InspectorInput): InspectorParam {
  const value = input.params[spec.name] ?? spec.default;
  return {
    name: spec.name,
    label: readable(spec.name),
    value,
    min: spec.min,
    max: spec.max,
    step: stepSize(spec),
    unit: readable(spec.unit),
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
    colour: workColour(tool),
    definition: tool.definition,
    faces: mapFaces(input),
    params: specs.filter((spec) => !isCostParam(spec)).map((spec) => mapParam(spec, input)),
    costs: specs.filter(isCostParam).map((spec) => mapParam(spec, input)),
    preview: mapPreview(input),
    slots: mapSlots(input),
    issue,
    canApply: issue === null && refusal === null,
  };
}
