import type { NoRouteReason, SceneFrame, SceneGeometry } from '@dotln-angular/scene-engine';
import { emptyGeometry, leastValueOf } from '@dotln-angular/scene-engine';

import type {
  FieldToolId,
  FieldView,
  GeometryRowView,
  NoRouteNotice,
} from '../models/scene-view-model';
import type { SceneUnitStyle } from '../renderers/scene-renderer';

/** The cell sizes the field tools offer for the tile graph, the engine's default among them. */
export const cellSizes: readonly number[] = [1.25, emptyGeometry.cellSize, 5, 10];

const tenths = (value: number) => Math.round(value * 10) / 10;

export type ShapeValueName = 'x1' | 'y1' | 'x2' | 'y2' | 'thickness' | 'x' | 'y' | 'radius';

/** The walls, then the obstacles, each with the numbers a field step names it by. */
export function mapGeometryRows(
  geometry: SceneGeometry,
  label: (name: ShapeValueName) => string = (name) => name,
): readonly GeometryRowView[] {
  const value = (name: ShapeValueName, amount: number) => ({
    name,
    value: tenths(amount),
    label: label(name),
    min: leastValueOf(name),
  });
  return [
    ...geometry.walls.map(({ shape, from, to, thickness }) => ({
      shape,
      kind: 'wall' as const,
      values: [
        value('x1', from.x),
        value('y1', from.y),
        value('x2', to.x),
        value('y2', to.y),
        value('thickness', thickness),
      ],
    })),
    ...geometry.obstacles.map(({ shape, centre, radius }) => ({
      shape,
      kind: 'obstacle' as const,
      values: [value('x', centre.x), value('y', centre.y), value('radius', radius)],
    })),
  ];
}

export const mapField = (
  geometry: SceneGeometry,
  tool: FieldToolId,
  label?: (name: ShapeValueName) => string,
): FieldView => ({
  tool,
  cellSize: geometry.cellSize,
  cellSizes,
  shapes: mapGeometryRows(geometry, label),
});

/** A shape's numbers as a field step names them, read from the geometry as they stand. */
export function shapeParams(
  geometry: SceneGeometry,
  shape: number,
): { kind: 'field.wall' | 'field.obstacle'; params: Readonly<Record<string, number>> } | null {
  const wall = geometry.walls.find((kept) => kept.shape === shape);
  if (wall) {
    const { from, to, thickness } = wall;
    return {
      kind: 'field.wall',
      params: { x1: from.x, y1: from.y, x2: to.x, y2: to.y, thickness, shape },
    };
  }
  const obstacle = geometry.obstacles.find((kept) => kept.shape === shape);
  if (!obstacle) return null;
  const { centre, radius } = obstacle;
  return { kind: 'field.obstacle', params: { x: centre.x, y: centre.y, radius, shape } };
}

const reasons: readonly NoRouteReason[] = ['no-path', 'unreachable-goal', 'unreachable-start'];

/** The units with no route, by the reason, each named by its label and its id. */
export function mapNoRoute(
  frame: SceneFrame,
  styles: readonly SceneUnitStyle[],
): readonly NoRouteNotice[] {
  const labels = new Map(styles.map(({ id, label }) => [id, label]));
  return reasons.flatMap((reason) => {
    const units = frame.routes
      .filter((route) => route.reason === reason)
      .map(({ id }) => `${labels.get(id) ?? id} ${id}`);
    return units.length === 0 ? [] : [{ reason, count: units.length, names: units.join(', ') }];
  });
}
