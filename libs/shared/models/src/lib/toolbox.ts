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

/** The transform kinds the soldier scene's engine interprets. */
export const sceneTransformKinds: readonly TransformKind[] = [
  TransformKind.SteerBlend,
  TransformKind.SteerPriority,
  TransformKind.FormationTwoLevel,
  TransformKind.FormationFixed,
  TransformKind.ObjectiveSet,
];

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
export enum HookDomain {
  Planning = 'D1',
  OrderLifecycle = 'D2',
  GateAndHarness = 'D3',
  RecordsAndProjections = 'D4',
  Publication = 'D5',
  KitAndInstances = 'D6',
  ConsoleAndUiHosts = 'D7',
  FeedbackCompiler = 'D8',
  OperatorWorkflow = 'D9',
  InstanceWork = 'D10',
  AgentBehaviour = 'D11',
}
export interface ToolContent {
  readonly definition: string;
  readonly place: {
    readonly part?: string;
    readonly chapter?: string;
    readonly section?: string;
    readonly subsection?: string;
  };
  readonly related: readonly { readonly title: string; readonly id: ToolId | null }[];
  readonly hooks: readonly { readonly domain: HookDomain; readonly clause: string }[];
  readonly verified: {
    readonly kind: 'sourced' | 'model-knowledge' | 'partial';
    readonly note: string;
  };
}
export interface ToolBase extends ToolContent {
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

/** A typed tool whose transform the soldier scene's engine interprets. */
export const isSceneTool = (tool: Tool) =>
  tool.status === 'typed' && sceneTransformKinds.includes(tool.faces.transform.kind);

export interface CatalogMap {
  readonly file: string;
  readonly rows: number;
  readonly sha256: string;
}
export interface CatalogCheckpoint {
  readonly schema: 'tool-v1';
  readonly batch: string;
  readonly maps: readonly CatalogMap[];
  readonly tools: readonly Tool[];
}

/** One work on the catalog shelf; scene is null for a work the shelf has no entry for. */
export interface CatalogWork {
  readonly work: WorkSlug;
  readonly title: string;
  readonly scene: SceneTypeId | null;
  readonly count: number;
  readonly studied: number;
}
/** A section of a chapter in a work's contents, with its concepts in source order. */
export interface CatalogSection {
  readonly title: string;
  readonly tools: readonly Tool[];
}
/** A chapter in a work's contents. */
export interface CatalogChapter {
  readonly key: string;
  readonly part: string;
  readonly title: string;
  readonly count: number;
  readonly sections: readonly CatalogSection[];
}

export interface CatalogReadingState {
  readonly version: 1;
  readonly work: WorkSlug | null;
  readonly chapter: string | null;
  readonly section: string | null;
  readonly selectedId: ToolId | null;
  readonly history: readonly ToolId[];
  /** The title of the newest reading, so a page can name it without loading its work. */
  readonly lastTitle: string | null;
}

export const catalogStudiedFilters = ['studied', 'unstudied'] as const;
export type CatalogStudiedFilter = (typeof catalogStudiedFilters)[number];

/**
 * Catalog filter dimensions. The reading surface's search facets set work, kind,
 * status and studied; scene and transform remain selector dimensions with no facet of their own.
 */
export interface CatalogFilters {
  readonly work: WorkSlug | null;
  readonly kind: ToolKind | null;
  readonly scene: SceneTypeId | null;
  readonly transform: TransformKind | null;
  readonly status: ToolStatus | null;
  readonly studied: CatalogStudiedFilter | null;
}
