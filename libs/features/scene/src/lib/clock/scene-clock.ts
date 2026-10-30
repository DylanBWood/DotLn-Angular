import { inject, Injectable, InjectionToken } from '@angular/core';
import {
  animationFrames,
  BehaviorSubject,
  distinctUntilChanged,
  EMPTY,
  filter,
  interval,
  map,
  merge,
  type Observable,
  scan,
  type SchedulerLike,
  Subject,
  switchMap,
} from 'rxjs';

import { frameSeconds } from '@dotln-angular/scene-engine';

/** A source of driver frames, each carrying how many fixed steps fell due. */
export interface SceneClockDriver {
  readonly frames$: Observable<number>;
}

export const SceneClockDriverToken = new InjectionToken<SceneClockDriver>(
  'dotln-angular.features.scene.clock-driver',
);

// A long pause, such as a hidden tab, must not make the scene race to catch up.
const mostStepsPerFrame = 4;

/** Drives the scene from the browser's animation frames, at a fixed simulated step. */
export function animationFrameDriver(): SceneClockDriver {
  return {
    frames$: animationFrames().pipe(
      scan(
        (carry, { elapsed }) => {
          const seconds = (elapsed - carry.elapsed) / 1000 + carry.owed;
          const due = Math.floor(seconds / frameSeconds);
          return {
            elapsed,
            owed: seconds - due * frameSeconds,
            steps: Math.min(due, mostStepsPerFrame),
          };
        },
        { elapsed: 0, owed: 0, steps: 0 },
      ),
      map(({ steps }) => steps),
      filter((steps) => steps > 0),
    ),
  };
}

/** Drives the scene from a scheduler, so a spec can run minutes of scene in no time at all. */
export function virtualTimeDriver(scheduler: SchedulerLike): SceneClockDriver {
  return {
    frames$: interval(1000 * frameSeconds, scheduler).pipe(map(() => 1)),
  };
}

/** Advances only when told to, one driver frame per call. */
export function manualDriver() {
  const frames = new Subject<number>();
  return {
    frames$: frames.asObservable(),
    tick: (steps = 1) => frames.next(steps),
  };
}

/** The scene's time: a driver gated by play and pause, plus steps taken by hand. */
@Injectable()
export class SceneClock {
  readonly #driver = inject(SceneClockDriverToken);
  readonly #running = new BehaviorSubject(false);
  readonly #stepped = new Subject<number>();

  readonly ticks$: Observable<number> = merge(
    this.#stepped,
    this.#running.pipe(
      distinctUntilChanged(),
      switchMap((running) => (running ? this.#driver.frames$ : EMPTY)),
    ),
  );

  play() {
    this.#running.next(true);
  }

  pause() {
    this.#running.next(false);
  }

  /** Takes steps by hand, whether or not the driver is running. */
  tick(steps = 1) {
    this.#stepped.next(steps);
  }
}
