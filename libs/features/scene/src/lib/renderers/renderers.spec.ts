import type { SceneFrame } from '@dotln-angular/scene-engine';

import { NullSceneRenderer } from './null-scene-renderer';
import { TextSceneRenderer } from './text-scene-renderer';

const frame: SceneFrame = {
  frameNo: 3,
  field: { width: 120, height: 80 },
  units: [
    {
      id: 'a',
      position: { x: 1, y: 1 },
      velocity: { x: 0, y: 0 },
      heading: { x: 1, y: 0 },
      radius: 0.5,
      activity: 'idle',
    },
  ],
  anchors: [],
  slots: [],
  collisions: [],
  objective: null,
};

it('the text renderer turns a frame into one row per unit, and lets go on dispose', () => {
  const renderer = new TextSceneRenderer();
  renderer.draw(frame, ['a']);
  expect(renderer.rows).toEqual([
    { id: 'a', position: 'north-west', speed: 'still', activity: 'idle', selected: true },
  ]);
  renderer.resize();
  renderer.dispose();
  expect(renderer.rows).toEqual([]);
});

it('the null renderer draws nothing and remembers what it was given', () => {
  const renderer = new NullSceneRenderer();
  renderer.draw(frame, ['a']);
  renderer.resize(10, 20);
  renderer.dispose();
  expect(renderer).toMatchObject({
    draws: 1,
    disposed: true,
    size: { width: 10, height: 20 },
    last: { frame, selection: ['a'], ghost: null },
  });
});
