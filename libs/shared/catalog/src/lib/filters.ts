import type {
  CatalogFilters,
  SceneTypeId,
  Tool,
  ToolKind,
  ToolStatus,
  WorkSlug,
} from '@dotln-angular/models';
import {
  sceneTypeIds,
  toolKinds,
  toolStatuses,
  TransformKind,
  workSlugs,
} from '@dotln-angular/models';
import { R, RA } from '@dotln-angular/utils';

type ToolFilter = (tools: readonly Tool[]) => Tool[];

export const byWork = (work: WorkSlug): ToolFilter => R.filter((tool: Tool) => tool.work === work);
export const byKind = (kind: ToolKind): ToolFilter => R.filter((tool: Tool) => tool.kind === kind);
export const byStatus = (status: ToolStatus): ToolFilter =>
  R.filter((tool: Tool) => tool.status === status);
export const byTransform = (kind: TransformKind): ToolFilter =>
  R.filter((tool: Tool) => tool.status === 'typed' && tool.faces.transform.kind === kind);
export const bySceneType = (scene: SceneTypeId): ToolFilter =>
  R.filter((tool: Tool) => tool.faces?.scene.includes(scene) ?? false);
export const firstThree = (work: WorkSlug) =>
  R.pipe(byWork(work), byStatus('typed'), (tools: readonly Tool[]) =>
    [...tools].sort((a, b) => a.id.localeCompare(b.id)).slice(0, 3),
  );

export const emptyCatalogFilters: CatalogFilters = {
  work: null,
  kind: null,
  scene: null,
  transform: null,
  status: null,
};
export const catalogFilterOptions: Readonly<Record<keyof CatalogFilters, readonly string[]>> = {
  work: workSlugs,
  kind: toolKinds,
  scene: sceneTypeIds,
  transform: Object.values(TransformKind),
  status: toolStatuses,
};

export function availableCatalogOptions(tools: readonly Tool[]) {
  const available = new Set<string>(tools.map((tool) => tool.work));
  return {
    ...catalogFilterOptions,
    work: catalogFilterOptions.work.filter((work) => available.has(work)),
  };
}

export function isCatalogFilters(value: unknown): value is CatalogFilters {
  if (typeof value !== 'object' || value === null || Object.keys(value).length !== 5) return false;
  return Object.entries(catalogFilterOptions).every(([key, options]) => {
    if (!(key in value)) return false;
    const selected: unknown = Reflect.get(value, key);
    // Unknown input can be Ramda's placeholder, whose result is a function.
    return (
      selected === null ||
      (RA.isNonEmptyString(selected) === true && options.some((option) => option === selected))
    );
  });
}

export function filterCatalog(tools: readonly Tool[], filters: CatalogFilters): readonly Tool[] {
  return tools.filter(
    (tool) =>
      (!filters.work || tool.work === filters.work) &&
      (!filters.kind || tool.kind === filters.kind) &&
      (!filters.scene || tool.faces?.scene.includes(filters.scene)) &&
      (!filters.transform ||
        (tool.status === 'typed' && tool.faces.transform.kind === filters.transform)) &&
      (!filters.status || tool.status === filters.status),
  );
}
