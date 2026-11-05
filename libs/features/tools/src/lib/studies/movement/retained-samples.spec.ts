import { vi } from 'vitest';

import { loadStudy, studyTranslate } from '../../../../testing/src';
import { present as presentFlock } from './flocking.presentation';
import * as flockSimulation from './flocking.simulation';
import { present as presentCreatures } from './making-the-creatures.presentation';
import * as creatureSimulation from './making-the-creatures.simulation';
import { present as presentPipeline } from './steering-pipeline.presentation';
import * as pipelineSimulation from './steering-pipeline.simulation';

it('uses the retained flock snapshot for its motor arrows and worked next velocity', async () => {
  const record = await loadStudy('aifg-a:145');
  const p = flockSimulation.readFlockingParameters(record.example.parameters);
  const samples = flockSimulation.flockingSamples(p);
  expect(samples[0].next).toBe(samples[1].state);
  expect(samples[0].readings[0].acceleration).toEqual({ x: 5, y: 0 });
  expect(samples[0].next[0].velocity).toEqual({ x: 0.5, y: 0 });
  const reading = vi.spyOn(flockSimulation, 'readFlock');
  const advancing = vi.spyOn(flockSimulation, 'stepFlock');
  try {
    const run = presentFlock(p, samples, studyTranslate);
    expect(run.motion.frames[0].values['acceleration']).toBe('(5.00, 0.00)');
    expect(run.motion.frames[0].worked?.lines.join(' ')).toContain('(0.50, 0.00)');
    expect(reading).not.toHaveBeenCalled();
    expect(advancing).not.toHaveBeenCalled();
  } finally {
    reading.mockRestore();
    advancing.mockRestore();
  }
});

it('uses the accepted pipeline attempts that produced its next committed state', async () => {
  const record = await loadStudy('aifg-a:153');
  const example = pipelineSimulation.readParameters(record.example.parameters);
  const samples = pipelineSimulation.pipelineSamples(example);
  expect(samples[0].calculation.next).toBe(samples[1].state);
  expect(samples[0].calculation.attempts.map(({ accepted }) => accepted)).toEqual([false, true]);
  const advancing = vi.spyOn(pipelineSimulation, 'calculatePipelineStep');
  try {
    const run = presentPipeline(example, samples, studyTranslate);
    expect(run.motion.frames[0].worked?.lines.join(' ')).toContain('8.00');
    expect(run.motion.frames[1].bodies[0].x).toBe(samples[0].next.position.x);
    expect(advancing).not.toHaveBeenCalled();
  } finally {
    advancing.mockRestore();
  }
});

it('retains every creature reading and its prescribed wander angle for narration', async () => {
  const record = await loadStudy('aifg-b:373');
  const p = creatureSimulation.readCreatureParameters(record.example.parameters);
  const samples = creatureSimulation.creatureSamples(p);
  expect(samples[0].next).toBe(samples[1].state);
  expect(samples[1].next[0].wanderAngle).toBe(samples[1].readings[0].angle);
  expect(samples[0].next[0].velocity.x).toBeCloseTo(0.332);
  const reading = vi.spyOn(creatureSimulation, 'readCreature');
  const advancing = vi.spyOn(creatureSimulation, 'stepCreatures');
  try {
    const run = presentCreatures(p, samples, studyTranslate);
    expect(run.motion.frames[0].worked?.lines.join(' ')).toContain('(0.33, 0.10)');
    expect(reading).not.toHaveBeenCalled();
    expect(advancing).not.toHaveBeenCalled();
  } finally {
    reading.mockRestore();
    advancing.mockRestore();
  }
});
