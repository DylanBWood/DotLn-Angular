import type {
  AppError,
  CatalogFilters,
  CatalogReadingState,
  CatalogSummary,
  ConceptStudy,
  Tool,
  ToolId,
  WorkSlug,
} from '@dotln-angular/models';

/** A mining API can replace the bundled reader without changing feature code. */
export interface CatalogLoader {
  load(work?: WorkSlug): Promise<readonly Tool[]>;
  /** A concept's study, or null when none has been written. Loads that work's studies once. */
  study(id: ToolId): Promise<ConceptStudy | null>;
  /** The works, their counts and their studies, without loading any work. */
  summary(): Promise<CatalogSummary>;
}

export type CatalogChunk = () => Promise<{ readonly default: unknown }>;
export type CatalogChunks = Readonly<Partial<Record<WorkSlug, readonly CatalogChunk[]>>>;
export type StudyChunks = Readonly<Partial<Record<WorkSlug, CatalogChunk>>>;
export type SummaryChunks = readonly [catalog: CatalogChunk, studies: CatalogChunk];

export interface CatalogState extends CatalogReadingState {
  readonly tools: readonly Tool[];
  readonly filters: CatalogFilters;
  readonly selectedId: ToolId | null;
  readonly page: number;
  readonly failure: AppError | null;
  readonly query: string;
  readonly backStack: readonly ToolId[];
  readonly summary: CatalogSummary | null;
  readonly summaryFailure: AppError | null;
}
