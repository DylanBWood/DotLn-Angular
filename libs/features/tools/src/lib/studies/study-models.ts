import type { StudyModelModule } from './study-model';

const eip = 'libs/features/tools/src/lib/studies/eip';
const movement = 'libs/features/tools/src/lib/studies/movement';
const poeaa = 'libs/features/tools/src/lib/studies/poeaa';
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
  [`${movement}/actuator.model.ts`]: () => import('./movement/actuator.model'),
  [`${movement}/align.model.ts`]: () => import('./movement/align.model'),
  [`${movement}/arrive.model.ts`]: () => import('./movement/arrive.model'),
  [`${movement}/blending-versus-arbitration.model.ts`]: () =>
    import('./movement/blending-versus-arbitration.model'),
  [`${movement}/collision-avoidance.model.ts`]: () =>
    import('./movement/collision-avoidance.model'),
  [`${movement}/coordinated-movement.model.ts`]: () =>
    import('./movement/coordinated-movement.model'),
  [`${movement}/corner-trap.model.ts`]: () => import('./movement/corner-trap.model'),
  [`${movement}/equilibrium-fallback.model.ts`]: () =>
    import('./movement/equilibrium-fallback.model'),
  [`${movement}/face.model.ts`]: () => import('./movement/face.model'),
  [`${movement}/fixed-formations.model.ts`]: () => import('./movement/fixed-formations.model'),
  [`${movement}/flee.model.ts`]: () => import('./movement/flee.model'),
  [`${movement}/flocking.model.ts`]: () => import('./movement/flocking.model'),
  [`${movement}/formation-pattern-interface.model.ts`]: () =>
    import('./movement/formation-pattern-interface.model'),
  [`${movement}/group-movement.model.ts`]: () => import('./movement/group-movement.model'),
  [`${movement}/iterative-targeting.model.ts`]: () =>
    import('./movement/iterative-targeting.model'),
  [`${movement}/jump-points.model.ts`]: () => import('./movement/jump-points.model'),
  [`${movement}/kinematic-arrive.model.ts`]: () => import('./movement/kinematic-arrive.model'),
  [`${movement}/kinematic-wander.model.ts`]: () => import('./movement/kinematic-wander.model'),
  [`${movement}/making-the-creatures.model.ts`]: () =>
    import('./movement/making-the-creatures.model'),
  [`${movement}/motor-control.model.ts`]: () => import('./movement/motor-control.model'),
  [`${movement}/movement-in-the-third-dimension.model.ts`]: () =>
    import('./movement/movement-in-the-third-dimension.model'),
  [`${movement}/obstacle-and-wall-avoidance.model.ts`]: () =>
    import('./movement/obstacle-and-wall-avoidance.model'),
  [`${movement}/priority-steering.model.ts`]: () => import('./movement/priority-steering.model'),
  [`${movement}/projectile-trajectory.model.ts`]: () =>
    import('./movement/projectile-trajectory.model'),
  [`${movement}/pursue.model.ts`]: () => import('./movement/pursue.model'),
  [`${movement}/satisfaction-radius.model.ts`]: () =>
    import('./movement/satisfaction-radius.model'),
  [`${movement}/scalable-formations.model.ts`]: () =>
    import('./movement/scalable-formations.model'),
  [`${movement}/seek.model.ts`]: () => import('./movement/seek.model'),
  [`${movement}/separation.model.ts`]: () => import('./movement/separation.model'),
  [`${movement}/slot-assignment.model.ts`]: () => import('./movement/slot-assignment.model'),
  [`${movement}/steering-behaviors.model.ts`]: () => import('./movement/steering-behaviors.model'),
  [`${movement}/steering-output.model.ts`]: () => import('./movement/steering-output.model'),
  [`${movement}/steering-pipeline.model.ts`]: () => import('./movement/steering-pipeline.model'),
  [`${movement}/the-firing-solution.model.ts`]: () =>
    import('./movement/the-firing-solution.model'),
  [`${movement}/two-and-a-half-dimensions.model.ts`]: () =>
    import('./movement/two-and-a-half-dimensions.model'),
  [`${movement}/two-level-formation-steering.model.ts`]: () =>
    import('./movement/two-level-formation-steering.model'),
  [`${movement}/variable-matching.model.ts`]: () => import('./movement/variable-matching.model'),
  [`${movement}/velocity-matching.model.ts`]: () => import('./movement/velocity-matching.model'),
  [`${movement}/wander.model.ts`]: () => import('./movement/wander.model'),
  [`${movement}/weighted-blending.model.ts`]: () => import('./movement/weighted-blending.model'),
  [`${poeaa}/data-mapper.model.ts`]: () => import('./poeaa/data-mapper.model'),
  [`${poeaa}/data-transfer-object.model.ts`]: () => import('./poeaa/data-transfer-object.model'),
  [`${poeaa}/foreign-key-mapping.model.ts`]: () => import('./poeaa/foreign-key-mapping.model'),
  [`${poeaa}/gateway.model.ts`]: () => import('./poeaa/gateway.model'),
  [`${poeaa}/identity-field.model.ts`]: () => import('./poeaa/identity-field.model'),
  [`${poeaa}/identity-map.model.ts`]: () => import('./poeaa/identity-map.model'),
  [`${poeaa}/lazy-load.model.ts`]: () => import('./poeaa/lazy-load.model'),
  [`${poeaa}/optimistic-offline-lock.model.ts`]: () =>
    import('./poeaa/optimistic-offline-lock.model'),
  [`${poeaa}/pessimistic-offline-lock.model.ts`]: () =>
    import('./poeaa/pessimistic-offline-lock.model'),
  [`${poeaa}/plugin.model.ts`]: () => import('./poeaa/plugin.model'),
  [`${poeaa}/record-set.model.ts`]: () => import('./poeaa/record-set.model'),
  [`${poeaa}/registry.model.ts`]: () => import('./poeaa/registry.model'),
  [`${poeaa}/remote-facade.model.ts`]: () => import('./poeaa/remote-facade.model'),
  [`${poeaa}/service-layer.model.ts`]: () => import('./poeaa/service-layer.model'),
  [`${poeaa}/service-stub.model.ts`]: () => import('./poeaa/service-stub.model'),
  [`${poeaa}/unit-of-work.model.ts`]: () => import('./poeaa/unit-of-work.model'),
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
