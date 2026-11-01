import type { StudyModelModule } from './study-model';

const eip = 'libs/features/tools/src/lib/studies/eip';
const movement = 'libs/features/tools/src/lib/studies/movement';
const rxjs = 'libs/features/tools/src/lib/studies/rxjs';

// Each drawing's model loads with the study that reads it. The key is the path the record names
// in `visual.model`, and a spec keeps the two lists equal.
export const studyModels: Readonly<Record<string, () => Promise<StudyModelModule>>> = {
  [`${eip}/aggregator.ts`]: () => import('./eip/aggregator'),
  [`${eip}/canonical-data-model.ts`]: () => import('./eip/canonical-data-model'),
  [`${eip}/channel-adapter.ts`]: () => import('./eip/channel-adapter'),
  [`${eip}/command-message.ts`]: () => import('./eip/command-message'),
  [`${eip}/competing-consumers.ts`]: () => import('./eip/competing-consumers'),
  [`${eip}/content-based-router.ts`]: () => import('./eip/content-based-router'),
  [`${eip}/control-bus.ts`]: () => import('./eip/control-bus'),
  [`${eip}/correlation-identifier.ts`]: () => import('./eip/correlation-identifier'),
  [`${eip}/event-message.ts`]: () => import('./eip/event-message'),
  [`${eip}/guaranteed-delivery.ts`]: () => import('./eip/guaranteed-delivery'),
  [`${eip}/message-dispatcher.ts`]: () => import('./eip/message-dispatcher'),
  [`${eip}/message-expiration.ts`]: () => import('./eip/message-expiration'),
  [`${eip}/message-store.ts`]: () => import('./eip/message-store'),
  [`${eip}/message-translator.ts`]: () => import('./eip/message-translator'),
  [`${eip}/process-manager.ts`]: () => import('./eip/process-manager'),
  [`${eip}/publish-subscribe-channel.ts`]: () => import('./eip/publish-subscribe-channel'),
  [`${eip}/recipient-list.ts`]: () => import('./eip/recipient-list'),
  [`${eip}/request-reply.ts`]: () => import('./eip/request-reply'),
  [`${eip}/resequencer.ts`]: () => import('./eip/resequencer'),
  [`${eip}/transactional-client.ts`]: () => import('./eip/transactional-client'),
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
  [`${rxjs}/behavior-subject.ts`]: () => import('./rxjs/behavior-subject'),
  [`${rxjs}/catch-error.ts`]: () => import('./rxjs/catch-error'),
  [`${rxjs}/combine-latest.ts`]: () => import('./rxjs/combine-latest'),
  [`${rxjs}/concat-map.ts`]: () => import('./rxjs/concat-map'),
  [`${rxjs}/exhaust-map.ts`]: () => import('./rxjs/exhaust-map'),
  [`${rxjs}/finalize.ts`]: () => import('./rxjs/finalize'),
  [`${rxjs}/materialize.ts`]: () => import('./rxjs/materialize'),
  [`${rxjs}/merge-map.ts`]: () => import('./rxjs/merge-map'),
  [`${rxjs}/observe-on.ts`]: () => import('./rxjs/observe-on'),
  [`${rxjs}/repeat.ts`]: () => import('./rxjs/repeat'),
  [`${rxjs}/replay-subject.ts`]: () => import('./rxjs/replay-subject'),
  [`${rxjs}/retry.ts`]: () => import('./rxjs/retry'),
  [`${rxjs}/scan.ts`]: () => import('./rxjs/scan'),
  [`${rxjs}/share.ts`]: () => import('./rxjs/share'),
  [`${rxjs}/share-replay.ts`]: () => import('./rxjs/share-replay'),
  [`${rxjs}/start-with.ts`]: () => import('./rxjs/start-with'),
  [`${rxjs}/subject.ts`]: () => import('./rxjs/subject'),
  [`${rxjs}/switch-map.ts`]: () => import('./rxjs/switch-map'),
  [`${rxjs}/take-until.ts`]: () => import('./rxjs/take-until'),
  [`${rxjs}/timeout.ts`]: () => import('./rxjs/timeout'),
};
