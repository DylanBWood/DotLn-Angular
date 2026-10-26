export const workSlugs = [
  'aifg',
  'eip',
  'poeaa',
  'rxjs',
  'geb',
  'tt',
  'artofwar',
  'goal',
  'marquet',
  'gladwell',
  'taleb',
  'altb',
  'meadows',
  'poe',
  'fives',
  'pirsig',
  'poincare',
] as const;
export type WorkSlug = (typeof workSlugs)[number];
export type ToolId = `${string}:${number}`;
export const toolKinds = [
  'behaviour',
  'rule',
  'mode',
  'relationship',
  'analysis',
  'sceneType',
  'sceneElement',
  'metric',
  'background',
] as const;
export type ToolKind = (typeof toolKinds)[number];
export const sceneTypeIds = [
  'units-on-terrain',
  'pipeline',
  'channels',
  'marbles',
  'levels',
  'teams',
  'workplace',
  'builds',
] as const;
export type SceneTypeId = (typeof sceneTypeIds)[number];

export enum TransformKind {
  SteerBlend = 'steer.blend',
  SteerPriority = 'steer.priority',
  FormationTwoLevel = 'formation.twoLevel',
  FormationFixed = 'formation.fixed',
  ObjectiveSet = 'objective.set',
  SquadForm = 'squad.form',
  SquadDissolve = 'squad.dissolve',
  OrderIssue = 'order.issue',
  ChannelPolicy = 'channel.policy',
  GroundInfluence = 'ground.influence',
  GroundFrag = 'ground.frag',
  PathCost = 'path.cost',
  LevelZoom = 'level.zoom',
  LevelRing = 'level.ring',
}

export type SelectionTarget = 'unit' | 'squad' | 'commander' | 'channel' | 'region' | 'scene';
export type MetricId = string;
export type DotLnRole =
  | 'executor'
  | 'verifier'
  | 'reviewer'
  | 'repairer'
  | 'planner'
  | 'refuter'
  | 'release-close'
  | 'operator';
export type ToolRowType =
  | 'concept'
  | 'technique'
  | 'pattern'
  | 'principle'
  | 'tool'
  | 'trade-off'
  | 'anti-pattern'
  | 'data-structure'
  | 'algorithm'
  | 'observation';
export const toolStatuses = ['typed', 'untyped', 'background'] as const;
export type ToolStatus = (typeof toolStatuses)[number];
export interface ParamSpec {
  readonly name: string;
  readonly unit: string;
  readonly default: number;
  readonly min: number;
  readonly max: number;
}
export interface TypedTransform {
  readonly kind: TransformKind;
  readonly params: readonly ParamSpec[];
}
export interface UntypedTransform {
  readonly kind: 'untyped';
  readonly reason: string;
}
export interface ToolFaces<T = TypedTransform | UntypedTransform> {
  readonly scene: readonly SceneTypeId[];
  readonly selection: {
    readonly target: SelectionTarget;
    readonly min: number;
    readonly max: number | null;
  };
  readonly transform: T;
  readonly observable: readonly string[];
  readonly toyMetric: readonly MetricId[];
}
export interface ToolMap {
  readonly file: string;
  readonly line: number;
  readonly sha256: string;
}
export type ToolProvenance =
  | { readonly provenance: 'map'; readonly map: ToolMap }
  | { readonly provenance: 'public-work'; readonly map: null };
export interface ToolBase {
  readonly id: ToolId;
  readonly work: WorkSlug;
  readonly title: string;
  readonly rowType: ToolRowType;
  readonly classifiedBy: string;
  readonly analog?: { readonly roles: readonly DotLnRole[]; readonly clause: string };
}
export type Tool = ToolBase &
  ToolProvenance &
  (
    | {
        readonly kind: Exclude<ToolKind, 'background' | 'sceneElement' | 'metric'>;
        readonly status: 'typed';
        readonly faces: ToolFaces<TypedTransform>;
      }
    | {
        readonly kind: Exclude<ToolKind, 'background' | 'sceneElement' | 'metric'>;
        readonly status: 'untyped';
        readonly faces: ToolFaces<UntypedTransform>;
      }
    | {
        readonly kind: 'background' | 'sceneElement' | 'metric';
        readonly status: 'background';
        readonly faces?: never;
      }
  );

export interface CatalogMap {
  readonly file: string;
  readonly rows: number;
  readonly sha256: string;
}
export interface CatalogCheckpoint {
  readonly schema: 'tool-v0';
  readonly batch: string;
  readonly maps: readonly CatalogMap[];
  readonly tools: readonly Tool[];
}

export interface CatalogFilters {
  readonly work: WorkSlug | null;
  readonly kind: ToolKind | null;
  readonly scene: SceneTypeId | null;
  readonly transform: TransformKind | null;
  readonly status: ToolStatus | null;
}
