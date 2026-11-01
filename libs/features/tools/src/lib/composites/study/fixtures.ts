import { fillValues } from '../../studies/study-text';
import type { StudyView } from '../../types';
import {
  marblesFixture,
  marblesStudyModel,
  momentsFixture,
  motionFixture,
  timelineFixture,
} from '../study-visuals/fixtures';

/** A study with every representation, for the composite's stories and specs. */
export const studyViewFixture: StudyView = {
  id: 'sample:1',
  authoredBy: 'A study author',
  authoredOn: '2026-10-31',
  reviewers: 'factual-critic, reading-critic',
  intuition: {
    text: 'Point at the target and go.',
    situation: 'A scout runs for a flag.',
  },
  example: {
    name: 'A scout and a flag',
    description: 'One scout starts ten units from a flag.',
    parameters: { distance: 10 },
  },
  visual: {
    family: 'motion',
    view: 'motion',
    motion: motionFixture,
    timeline: timelineFixture,
    step: 4,
    moments: momentsFixture,
    legend: [
      { tone: 'actual', label: 'Solid green · actual' },
      { tone: 'desired', label: 'Dashed amber · desired' },
    ],
    caption: 'The arrow is the scout; the cross is the flag.',
    textEquivalent: 'The scout is 56 units from the flag.',
    note: 'The scout is still speeding up.',
    playing: false,
    inputs: [{ name: 'gap', label: 'Gap', unit: 'units', min: 1, max: 20, step: 1, value: 10 }],
  },
  expanded: [],
  worked: {
    title: 'Worked step: 2.00 → 2.50 seconds',
    lines: ['Find the distance.', 'Move toward it.'],
    note: 'The scout is still speeding up.',
  },
  pseudocode: 'direction = target - position\n\nposition += direction * dt',
  steps: [
    { title: 'Point at the target', text: 'Subtract.', code: 'direction = target - position' },
    { title: 'Move', text: 'Add.', code: 'position += direction * dt' },
  ],
  rxjs: { code: 'frames$.pipe(scan(step, start))', executable: false, spec: null },
  limits: ['Seek overshoots a fixed target.'],
  comparison: {
    title: 'What if the scout never slows?',
    intro: 'Two runs of the example.',
    timeline: timelineFixture,
    findings: ['The scout passes the flag.'],
    note: 'Values are rounded.',
  },
  implementations: [
    {
      project: 'A public library',
      url: 'https://example.org/library',
      relevance: 'It runs scouts in a game.',
      explanation: 'It clips the acceleration itself.',
    },
  ],
  references: [
    {
      title: 'A public reference',
      url: 'https://example.org/reference',
      accessed: '2026-10-31',
      supports: 'Seek accelerates toward the target at the limit.',
    },
  ],
  nearby: [{ id: 'sample:2', title: 'Arrive', why: 'It adds the braking Seek lacks.' }],
  next: null,
};

/** A study drawn as a marble diagram, with its code marked executable, for the specs and stories. */
export const marblesStudyViewFixture: StudyView = {
  ...studyViewFixture,
  id: 'sample:3',
  example: {
    name: 'A switch between two inner streams',
    description: 'The source emits a and then b; each opens an inner stream.',
    parameters: { values: 'a, b' },
  },
  visual: {
    family: 'marbles',
    marbles: marblesFixture,
    step: 4,
    moments: marblesStudyModel.moments,
    legend: marblesStudyModel.legend,
    caption: marblesStudyModel.caption,
    textEquivalent: fillValues('Frame {frame}: {now}.', marblesFixture.frames[4].values),
    note: 'The first inner stream is cut off before its second value.',
    playing: false,
    inputs: [],
  },
  worked: { title: 'Frame 4', lines: ['source$: a at 1, b at 4'] },
  rxjs: {
    code: 'out$ = source$.pipe(switchMap((value) => inner(value)));',
    executable: true,
    spec: 'libs/features/tools/src/lib/studies/rxjs/switch-map.spec.ts',
  },
  comparison: null,
};
