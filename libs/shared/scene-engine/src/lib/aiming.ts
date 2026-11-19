import type { LauncherSettings, SimulationState, Vec2 } from './types';

/** Arcade timing is authored in beats. The same tempo plays on every size of board. */
const framesPerBeat = 12;

export function animationCue(settings: LauncherSettings) {
  if (settings.aim === 'plain') return null;
  const beats = settings.speed < 24 ? 4 : settings.speed < 60 ? 3 : 2;
  const delay = Math.min(8, Math.ceil(settings.drag * 8));
  const later = settings.aim === 'repeat' ? Math.min(delay, settings.iterations) : 0;
  return { poseFrame: (beats + later) * framesPerBeat, endFrame: (beats + delay) * framesPerBeat };
}

/** Record a shared clip. Each movement tick preserves roster order and excludes new shots. */
export function boardPoses(
  start: SimulationState,
  move: (board: SimulationState) => SimulationState,
) {
  const poses: (readonly Vec2[])[] = [];
  let board = start;
  return (index: number, frame: number) => {
    if (!poses.length) poses.push(start.units.map((unit) => unit.position));
    while (poses.length <= frame) {
      board = move(board);
      poses.push(board.units.map((unit) => unit.position));
    }
    return poses[frame][index];
  };
}
