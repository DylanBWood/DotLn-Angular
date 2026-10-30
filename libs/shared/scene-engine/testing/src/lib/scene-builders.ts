import type { CompositionStep, SceneDefinition, Unit, UnitId } from '../../../src';

export function createTestUnit(id: UnitId, overrides: Partial<Unit> = {}): Unit {
  return {
    id,
    labels: { lifecycle: 'executor' },
    unitClass: 'close-combat',
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    heading: { x: 1, y: 0 },
    maxSpeed: 12,
    maxAcceleration: 30,
    radius: 0.5,
    ...overrides,
  };
}

export function createTestScene(
  units: readonly Unit[],
  overrides: Partial<SceneDefinition> = {},
): SceneDefinition {
  return {
    id: 'test-scene',
    sceneType: 'units-on-terrain',
    field: { width: 120, height: 80 },
    seed: 1,
    units,
    ...overrides,
  };
}

/** Units on a grid, spaced so no two touch, with headings that disagree. */
export function createScatteredUnits(count: number): readonly Unit[] {
  const headings = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
  ];
  return Array.from({ length: count }, (_, index) =>
    createTestUnit(`unit-${index + 1}`, {
      position: { x: 30 + (index % 5) * 15, y: 20 + Math.floor(index / 5) * 15 },
      heading: headings[index % headings.length],
    }),
  );
}

export function createTestStep(
  kind: string,
  selection: readonly UnitId[],
  params: CompositionStep['params'] = {},
  at = 0,
): CompositionStep {
  return { at, toolId: `test:${kind}`, kind, selection, params };
}
