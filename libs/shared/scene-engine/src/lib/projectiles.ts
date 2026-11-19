import { animationCue, boardPoses } from './aiming';
import { reformAfterKnockout } from './formation';
import { castRay, rayToCircle } from './geometry';
import type {
  BulletState,
  Impact,
  LauncherSettings,
  ShotPreview,
  SimulationState,
  UnitState,
  Vec2,
} from './types';
import { add, distance, length, normalize, scale, subtract, zero } from './vectors';

export const launcherDefaults: LauncherSettings = {
  target: null,
  aim: 'plain',
  iterations: 4,
  speed: 36,
  range: 100,
  rate: 2,
  radius: 0.4,
  drag: 0,
  knockoutHits: 0,
};

export const impactFrames = 14;

/** The point currently marked on this board. A missing, retired or self-selected piece is idle. */
export function markedPoint(unit: UnitState, state: SimulationState): Vec2 | null {
  const { target } = unit.launcher;
  if (target === null || unit.down) return null;
  if (target === 0) return state.objective?.position ?? null;
  const other = state.units[target - 1];
  return other && !other.down && other.id !== unit.id ? other.position : null;
}

export function inReach(unit: UnitState, state: SimulationState): boolean {
  const point = markedPoint(unit, state);
  if (point === null) return false;
  const span = distance(unit.position, point);
  return span > 0 && span <= unit.launcher.range;
}

/** A marked piece supplies its recorded pose. A point stays where the player put it. */
function cuePoint(
  target: number | null,
  point: Vec2,
  poseFrame: number,
  poseAt: ReturnType<typeof boardPoses>,
): Vec2 {
  return target && target > 0 ? poseAt(target - 1, poseFrame) : point;
}

export function previewShot(
  state: SimulationState,
  unit: UnitState,
  seconds: number,
  move: (board: SimulationState) => SimulationState,
): ShotPreview {
  const settings = unit.launcher;
  const cue = animationCue(settings);
  const point = markedPoint(unit, state);
  const span = point === null ? Infinity : distance(point, unit.position);
  if (cue) {
    const admitted = point !== null && span > 0 && span <= settings.range;
    const destination = admitted
      ? cuePoint(settings.target, point, cue.poseFrame, boardPoses(state, move))
      : null;
    return {
      cue: {
        endFrame: cue.endFrame,
        poseFrame: admitted && settings.target !== 0 ? cue.poseFrame : null,
        beyondRange: destination !== null && distance(unit.position, destination) > settings.range,
      },
      hasTarget: point !== null,
      seconds: admitted ? cue.endFrame * seconds : null,
      reach: settings.range,
    };
  }
  let reach = 0;
  let speed = settings.speed;
  let arrival: number | null = null;
  for (let frame = 1; frame <= 600 && reach < settings.range && speed >= 0.01; frame++) {
    reach = Math.min(settings.range, reach + speed * seconds);
    speed *= Math.max(0, 1 - settings.drag * seconds);
    if (arrival === null && reach >= span) arrival = frame * seconds;
  }
  return { cue, hasTarget: point !== null, seconds: arrival, reach };
}

interface Contact {
  readonly position: Vec2;
  readonly distance: number;
  readonly unit: number | null;
}

function firstContact(
  bullet: BulletState,
  state: SimulationState,
  units: readonly UnitState[],
  travel: number,
): Contact | null {
  const direction = normalize(bullet.velocity);
  const wall = castRay(state.geometry, bullet.position, direction, travel, bullet.radius);
  let nearest: Contact | null = wall && {
    position: wall.point,
    distance: wall.distance,
    unit: null,
  };
  for (const [index, unit] of units.entries()) {
    if (unit.id === bullet.owner || unit.down) continue;
    const radius = unit.radius + bullet.radius;
    const at =
      distance(bullet.position, unit.position) <= radius
        ? 0
        : rayToCircle(bullet.position, direction, unit.position, radius);
    if (at === null || at > travel || (nearest && at >= nearest.distance)) continue;
    nearest = { position: add(bullet.position, scale(direction, at)), distance: at, unit: index };
  }
  return nearest;
}

function scoreHit(units: UnitState[], index: number, bullet: BulletState) {
  const struck = units[index];
  const hits = struck.hits + 1;
  const down = bullet.knockoutHits > 0 && hits >= bullet.knockoutHits;
  units[index] = down
    ? {
        ...struck,
        hits,
        down,
        velocity: zero,
        route: null,
        stallFrames: 0,
        behaviour: { ...struck.behaviour, path: null },
      }
    : { ...struck, hits };
  const owner = units.findIndex(({ id }) => id === bullet.owner);
  if (owner >= 0) units[owner] = { ...units[owner], scored: units[owner].scored + 1 };
  return down;
}

/** Resolve the current frame's contacts before admitting the next volley. */
function advanceFlight(state: SimulationState, units: UnitState[], seconds: number) {
  const bullets: BulletState[] = [];
  const impacts: Impact[] = state.impacts.filter((mark) => state.tick + 1 - mark.at < impactFrames);
  const down = new Set<string>();
  for (const bullet of state.bullets) {
    const speed = length(bullet.velocity);
    const travel = Math.min(bullet.rangeLeft, speed * seconds);
    const contact = firstContact(bullet, state, units, travel);
    if (contact) {
      const unitId = contact.unit === null ? null : units[contact.unit].id;
      impacts.push({ at: state.tick + 1, owner: bullet.owner, unitId, position: contact.position });
      if (contact.unit !== null && scoreHit(units, contact.unit, bullet))
        down.add(units[contact.unit].id);
    } else if (travel < bullet.rangeLeft && bullet.framesLeft !== 1) {
      const velocity =
        bullet.framesLeft === null
          ? scale(bullet.velocity, Math.max(0, 1 - bullet.drag * seconds))
          : bullet.velocity;
      // A streak too slow to advance a visible fraction of a cell has faded out.
      if (length(velocity) >= 0.01)
        bullets.push({
          ...bullet,
          position: add(bullet.position, scale(normalize(bullet.velocity), travel)),
          velocity,
          rangeLeft: bullet.rangeLeft - travel,
          framesLeft: bullet.framesLeft === null ? null : bullet.framesLeft - 1,
        });
    }
  }
  return { bullets, impacts, down };
}

/** Move existing streaks before a board piece moves or starts another shot. */
export function advanceProjectiles(
  state: SimulationState,
  seconds: number,
  move: (board: SimulationState) => SimulationState,
): SimulationState {
  if (
    !state.bullets.length &&
    !state.impacts.length &&
    state.units.every((unit) => unit.launcher.target === null || unit.down)
  )
    return state;
  const units = [...state.units];
  const { bullets, impacts, down } = advanceFlight(state, units, seconds);
  const next = {
    ...state,
    units,
    bullets,
    impacts,
    formations: down.size ? reformAfterKnockout(state.formations, units, down) : state.formations,
  };
  const poseAt = boardPoses(next, move);
  const launched: BulletState[] = [];
  const shooters = [...units];
  for (const [index, unit] of units.entries()) {
    if (state.tick < unit.nextShot) continue;
    const point = markedPoint(unit, next);
    if (!point || distance(point, unit.position) > unit.launcher.range) continue;
    const { speed, rate, range, radius, drag, knockoutHits } = unit.launcher;
    const cue = animationCue(unit.launcher);
    const destination = cue ? cuePoint(unit.launcher.target, point, cue.poseFrame, poseAt) : point;
    const delta = subtract(destination, unit.position);
    if (length(delta) === 0) continue;
    const velocity = cue
      ? scale(delta, 1 / (cue.endFrame * seconds))
      : scale(normalize(delta), speed);
    launched.push({
      owner: unit.id,
      position: unit.position,
      velocity,
      rangeLeft: range,
      radius,
      drag,
      knockoutHits,
      framesLeft: cue?.endFrame ?? null,
    });
    const beat = unit.nextShot > state.tick - 1 ? unit.nextShot : state.tick;
    shooters[index] = {
      ...unit,
      shots: unit.shots + 1,
      nextShot: beat + Math.max(1, 1 / (seconds * rate)),
    };
  }
  return launched.length ? { ...next, units: shooters, bullets: [...bullets, ...launched] } : next;
}
