import {
  castRay,
  clearMove,
  emptyGeometry,
  segmentToSegment,
  stopAtGeometry,
  touches,
} from './geometry';
import type { SceneGeometry } from './types';
import { length } from './vectors';

const field = (shapes: Partial<SceneGeometry>): SceneGeometry => ({ ...emptyGeometry, ...shapes });

// A thin wall standing upright at x = 10, from y = 0 to y = 10, and a disc of radius 2 at (30, 5).
const wall = { shape: 1, from: { x: 10, y: 0 }, to: { x: 10, y: 10 }, thickness: 0.2 };
const disc = { shape: 2, centre: { x: 30, y: 5 }, radius: 2 };
const shapes = field({ walls: [wall], obstacles: [disc] });
const radius = 0.5;

describe('segments and discs', () => {
  it('measures the least distance between two segments, nothing where they cross', () => {
    expect(segmentToSegment({ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 2, y: -1 }, { x: 2, y: 1 })).toBe(
      0,
    );
    expect(
      segmentToSegment({ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 6, y: 0 }, { x: 8, y: 0 }),
    ).toBeCloseTo(2);
    expect(
      segmentToSegment({ x: 0, y: 3 }, { x: 4, y: 3 }, { x: 2, y: -1 }, { x: 2, y: 1 }),
    ).toBeCloseTo(2);
  });

  it('says a body standing on a wall or a disc touches it, and one beside it does not', () => {
    expect(touches(shapes, { x: 10.5, y: 5 }, radius)).toBe(true);
    expect(touches(shapes, { x: 10.7, y: 5 }, radius)).toBe(false);
    expect(touches(shapes, { x: 32.4, y: 5 }, radius)).toBe(true);
    expect(touches(shapes, { x: 32.6, y: 5 }, radius)).toBe(false);
    expect(touches(emptyGeometry, { x: 10, y: 5 }, radius)).toBe(false);
  });
});

describe('the swept clearance test', () => {
  it('refuses a move through a thin wall, though both ends are clear of it', () => {
    expect(touches(shapes, { x: 9, y: 5 }, radius)).toBe(false);
    expect(touches(shapes, { x: 11, y: 5 }, radius)).toBe(false);
    expect(clearMove(shapes, { x: 9, y: 5 }, { x: 11, y: 5 }, radius)).toBe(false);
  });

  it('admits a move past the wall’s end with room for the body, and refuses one without', () => {
    expect(clearMove(shapes, { x: 9, y: 11 }, { x: 11, y: 11 }, radius)).toBe(true);
    expect(clearMove(shapes, { x: 9, y: 10.4 }, { x: 11, y: 10.4 }, radius)).toBe(false);
  });

  it('lets a body a shape was drawn over move away from it, never deeper into it', () => {
    const over = { x: 29, y: 5 };
    expect(touches(shapes, over, radius)).toBe(true);
    expect(clearMove(shapes, over, { x: 27, y: 5 }, radius)).toBe(true);
    expect(clearMove(shapes, over, { x: 29, y: 2 }, radius)).toBe(true);
    expect(clearMove(shapes, over, { x: 29.5, y: 5 }, radius)).toBe(false);
  });
});

describe('the ray cast', () => {
  it('returns the nearest hit on a wall’s face with its outward normal', () => {
    const hit = castRay(shapes, { x: 0, y: 5 }, { x: 1, y: 0 }, 20, radius);
    expect(hit?.distance).toBeCloseTo(10 - 0.1 - radius);
    expect(hit?.point.x).toBeCloseTo(9.4);
    expect(hit?.normal).toEqual({ x: -1, y: 0 });
  });

  it('meets a wall’s rounded end, a disc, and nothing beyond its reach', () => {
    const end = castRay(shapes, { x: 10, y: 20 }, { x: 0, y: -1 }, 20, radius);
    expect(end?.distance).toBeCloseTo(10 - 0.1 - radius);
    expect(end?.normal.y).toBeCloseTo(1);
    const round = castRay(shapes, { x: 20, y: 5 }, { x: 1, y: 0 }, 20, radius);
    expect(round?.distance).toBeCloseTo(10 - 2 - radius);
    expect(round?.normal.x).toBeCloseTo(-1);
    expect(castRay(shapes, { x: 0, y: 5 }, { x: 1, y: 0 }, 5, radius)).toBeNull();
    expect(castRay(shapes, { x: 0, y: 5 }, { x: -1, y: 0 }, 20, radius)).toBeNull();
  });
});

describe('the stop at geometry', () => {
  it('keeps a clear step whole', () => {
    expect(stopAtGeometry(shapes, { x: 5, y: 5 }, { x: 0, y: 6 }, radius, 1 / 60)).toEqual({
      velocity: { x: 0, y: 6 },
      stopped: false,
    });
  });

  it('takes away what would meet a wall and keeps what slides along it', () => {
    const met = stopAtGeometry(shapes, { x: 9.35, y: 5 }, { x: 6, y: 6 }, radius, 1 / 60);
    expect(met.stopped).toBe(true);
    expect(met.velocity.x).toBeCloseTo(0);
    expect(met.velocity.y).toBeCloseTo(6);
  });

  it('leaves a body in a corner nothing it can slide out by', () => {
    const corner = field({
      walls: [
        { shape: 1, from: { x: 0, y: 10 }, to: { x: 10, y: 10 }, thickness: 0.2 },
        { shape: 2, from: { x: 10, y: 0 }, to: { x: 10, y: 10 }, thickness: 0.2 },
      ],
    });
    const met = stopAtGeometry(corner, { x: 9.35, y: 9.35 }, { x: 6, y: 6 }, radius, 1 / 60);
    expect(met.stopped).toBe(true);
    expect(length(met.velocity)).toBeCloseTo(0, 9);
  });
});
