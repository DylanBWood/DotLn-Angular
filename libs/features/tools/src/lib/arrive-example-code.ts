export const arrivePseudocodeParts = {
  settle: `if abs(target - position) <= tolerance
   and abs(velocity) <= tolerance:
  return { position: target, velocity: 0 }`,
  desired: `offset = target - position
desired = sign(offset) * maxSpeed
desired *= min(1, abs(offset) / slowRadius)`,
  acceleration: `acceleration = clamp((desired - velocity) / responseTime,
                     -maxAcceleration, maxAcceleration)`,
  advance: `velocity = clamp(velocity + acceleration * dt,
                 -maxSpeed, maxSpeed)
position = position + velocity * dt`,
} as const;

export const arrivePseudocode = `${arrivePseudocodeParts.settle}

${arrivePseudocodeParts.desired}
${arrivePseudocodeParts.acceleration}
${arrivePseudocodeParts.advance}`;

export const arriveRxPseudocode = `frames$ = animationFrames().pipe(
  pairwise(),
  map(([before, now]) =>
    min((now.elapsed - before.elapsed) / 1000, 0.1))
)

state$ = frames$.pipe(
  withLatestFrom(target$.pipe(startWith(100))),
  scan((state, [dt, target]) =>
    stepArrive(state, target, dt), initialState),
  takeUntil(stop$)
)

subscription = state$.subscribe(draw)
// Dispose this subscription when the view closes.`;
