import { createTestScene, createTestUnit } from '../../testing/src';
import { animationCue, boardPoses } from './aiming';
import { launcherDefaults } from './projectiles';
import { createSimulation } from './simulation';

it('reads a marked pose from the clip and shares already recorded frames', () => {
  const board = createSimulation(createTestScene([createTestUnit('runner')]));
  const move = vi.fn((previous: typeof board) => {
    const tick = previous.tick + 1;
    return {
      ...previous,
      tick,
      units: previous.units.map((unit) => ({
        ...unit,
        position: { x: tick % 7, y: 80 - tick },
      })),
    };
  });
  const pose = boardPoses(board, move);
  const single = { ...launcherDefaults, aim: 'cue' as const };
  const repeated = { ...single, aim: 'repeat' as const, iterations: 4 };
  const clear = animationCue(single);
  const delayed = animationCue({ ...single, drag: 0.3 });
  const later = animationCue({ ...repeated, drag: 0.3 });
  if (!clear || !delayed || !later) throw new Error('Each assisted mode needs a board cue.');
  expect(clear.poseFrame).toBe(clear.endFrame);
  expect(delayed.poseFrame).toBe(clear.poseFrame);
  expect(delayed.poseFrame).toBeLessThan(delayed.endFrame);
  expect(later.poseFrame).toBe(delayed.endFrame);
  expect(pose(0, later.poseFrame)).toEqual({ x: later.poseFrame % 7, y: 80 - later.poseFrame });
  expect(pose(0, delayed.poseFrame)).toEqual({
    x: delayed.poseFrame % 7,
    y: 80 - delayed.poseFrame,
  });
  expect(move).toHaveBeenCalledTimes(later.poseFrame);
  expect(animationCue({ ...repeated, drag: 0.3, iterations: 1 })?.poseFrame).toBeLessThan(
    later.poseFrame,
  );
});
