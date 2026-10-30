import { createScatteredUnits, createTestScene, createTestStep } from '../../testing/src';
import { hashFrame } from './hash';
import { objectiveKind } from './interpreter';
import { advanceRun, applyToRun, startRun } from './run';
import { frameOf } from './simulation';
import { runBranch, runTrial } from './trial';
import type { CompositionStep } from './types';

const units = createScatteredUnits(12);
const ids = units.map((unit) => unit.id);
const scene = createTestScene(units, { seed: 7 });

const objective = createTestStep(objectiveKind, [], { x: 90, y: 40 }, 0);
const arrive = createTestStep('steer.blend', ids, { 'arrive-weight': 1 }, 100);
const wedge = createTestStep('formation.twoLevel', ids.slice(0, 6), { pattern: 0 }, 200);
const refused = createTestStep('level.ring', ids, {}, 5);

const hashAt = (steps: readonly CompositionStep[], frame: number) =>
  hashFrame(frameOf(runBranch(scene, steps, frame)[frame]));

describe('a run', () => {
  it('matches its replay, tick for tick, with a step made mid-run', () => {
    const steps = [objective, arrive];
    const made = createTestStep('steer.blend', ids, { 'separation-weight': 1 }, 50);
    const live = advanceRun(applyToRun(advanceRun(startRun(scene, steps), 50), made), 250);
    expect(hashFrame(frameOf(live.simulation))).toBe(hashAt([...steps, made], 300));
  });

  it('replays a step made on the frame of a scheduled one in the order it ran', () => {
    const steps = [objective, arrive, wedge];
    const made = createTestStep('steer.blend', ids, { 'arrive-weight': 1, 'slow-radius': 20 }, 200);
    const live = advanceRun(applyToRun(advanceRun(startRun(scene, steps), 200), made), 100);
    expect(hashFrame(frameOf(live.simulation))).toBe(hashAt([...steps, made], 300));
  });

  it('does not run a scheduled step twice when a step is made on its frame', () => {
    const made = createTestStep('steer.blend', ids, { 'separation-weight': 1 }, 100);
    const run = applyToRun(advanceRun(startRun(scene, [objective, arrive]), 100), made);
    expect(run.scheduled).toEqual([]);
  });

  it('still shows a refusal after the steps that follow it', () => {
    const replay = startRun(scene, [objective, refused, { ...arrive, at: 5 }, { ...wedge, at: 9 }]);
    expect(advanceRun(replay, 60).refusal?.kind).toBe('level.ring');
  });

  it('forgets a refusal once the operator has made a step of their own', () => {
    const replay = advanceRun(startRun(scene, [refused]), 60);
    const made = createTestStep('steer.blend', ids, { 'separation-weight': 1 }, 60);
    expect(applyToRun(replay, made).refusal).toBeNull();
  });
});

describe('a trial', () => {
  const before = [objective, arrive];
  const pivot = { ...wedge, at: 200 };
  const start = advanceRun(startRun(scene, [...before, pivot]), 200);
  const request = {
    id: 'trial',
    start,
    branchA: { label: 'before', steps: before },
    branchB: { label: 'after', steps: [...before, pivot] },
    frames: 600,
    sampleEvery: 10,
    focus: ids,
  };

  it('keeps the window and no more', () => {
    const { trial, framesA } = runTrial(request);
    expect(trial.from).toBe(200);
    expect(framesA).toHaveLength(601);
    expect(framesA[0].frameNo).toBe(200);
    expect(trial.metrics.collisions.a).toHaveLength(61);
  });

  it('marks the first divergence on the frame after the pivot', () => {
    expect(runTrial(request).trial.firstDivergenceFrame).toBe(201);
  });

  it('runs each branch exactly as a run from the first frame would', () => {
    const { framesA } = runTrial(request);
    expect(hashFrame(framesA[300])).toBe(hashAt(before, 500));
  });

  it('leaves the start it was given able to run on as the second branch', () => {
    runTrial(request);
    expect(hashFrame(frameOf(advanceRun(start, 300).simulation))).toBe(
      hashAt([...before, pivot], 500),
    );
  });
});
