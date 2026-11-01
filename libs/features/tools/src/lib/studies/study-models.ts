import type { StudyModelModule } from './study-model';

const movement = 'libs/features/tools/src/lib/studies/movement';

// Each drawing's model loads with the study that reads it. The key is the path the record names
// in `visual.model`, and a spec keeps the two lists equal.
export const studyModels: Readonly<Record<string, () => Promise<StudyModelModule>>> = {
  [`${movement}/align.model.ts`]: () => import('./movement/align.model'),
  [`${movement}/arrive.model.ts`]: () => import('./movement/arrive.model'),
  [`${movement}/equilibrium-fallback.model.ts`]: () =>
    import('./movement/equilibrium-fallback.model'),
  [`${movement}/face.model.ts`]: () => import('./movement/face.model'),
  [`${movement}/fixed-formations.model.ts`]: () => import('./movement/fixed-formations.model'),
  [`${movement}/flocking.model.ts`]: () => import('./movement/flocking.model'),
  [`${movement}/formation-pattern-interface.model.ts`]: () =>
    import('./movement/formation-pattern-interface.model'),
  [`${movement}/group-movement.model.ts`]: () => import('./movement/group-movement.model'),
  [`${movement}/making-the-creatures.model.ts`]: () =>
    import('./movement/making-the-creatures.model'),
  [`${movement}/priority-steering.model.ts`]: () => import('./movement/priority-steering.model'),
  [`${movement}/pursue.model.ts`]: () => import('./movement/pursue.model'),
  [`${movement}/scalable-formations.model.ts`]: () =>
    import('./movement/scalable-formations.model'),
  [`${movement}/seek.model.ts`]: () => import('./movement/seek.model'),
  [`${movement}/separation.model.ts`]: () => import('./movement/separation.model'),
  [`${movement}/slot-assignment.model.ts`]: () => import('./movement/slot-assignment.model'),
  [`${movement}/steering-pipeline.model.ts`]: () => import('./movement/steering-pipeline.model'),
  [`${movement}/two-level-formation-steering.model.ts`]: () =>
    import('./movement/two-level-formation-steering.model'),
  [`${movement}/velocity-matching.model.ts`]: () => import('./movement/velocity-matching.model'),
  [`${movement}/wander.model.ts`]: () => import('./movement/wander.model'),
  [`${movement}/weighted-blending.model.ts`]: () => import('./movement/weighted-blending.model'),
};
