import type { AppError, CatalogFilters, Tool, ToolId, WorkSlug } from '@dotln-angular/models';

/** A mining API can replace the bundled reader without changing feature code. */
export interface CatalogLoader {
  load(work?: WorkSlug): Promise<readonly Tool[]>;
}

export type CatalogChunk = () => Promise<{ readonly default: unknown }>;
export type CatalogChunks = Readonly<Partial<Record<WorkSlug, readonly CatalogChunk[]>>>;

export interface CatalogState {
  readonly tools: readonly Tool[];
  readonly filters: CatalogFilters;
  readonly selectedId: ToolId | null;
  readonly page: number;
  readonly failure: AppError | null;
}
