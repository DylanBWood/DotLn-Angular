import { TestBed } from '@angular/core/testing';
import { VirtualTimeScheduler } from 'rxjs';

import { provideSceneClockTestKit } from '../../../testing/src';
import { SceneClock, SceneClockDriverToken, virtualTimeDriver } from './scene-clock';

function collect(clock: SceneClock) {
  const ticks: number[] = [];
  clock.ticks$.subscribe((steps) => ticks.push(steps));
  return ticks;
}

describe('the manual driver', () => {
  function setUp() {
    const kit = provideSceneClockTestKit();
    TestBed.configureTestingModule({ providers: [...kit.providers] });
    return { kit, clock: TestBed.inject(SceneClock) };
  }

  it('is silent until played', () => {
    const { kit, clock } = setUp();
    const ticks = collect(clock);
    kit.tick();
    expect(ticks).toEqual([]);
  });

  it('passes each driver frame through while playing, and stops on pause', () => {
    const { kit, clock } = setUp();
    const ticks = collect(clock);
    clock.play();
    kit.tick(2);
    kit.tick();
    clock.pause();
    kit.tick();
    expect(ticks).toEqual([2, 1]);
  });

  it('takes a step by hand whether or not it is playing', () => {
    const { clock } = setUp();
    const ticks = collect(clock);
    clock.tick();
    clock.tick(3);
    expect(ticks).toEqual([1, 3]);
  });

  it('leaves the driver out of a step by hand', () => {
    const { kit, clock } = setUp();
    const ticks = collect(clock);
    clock.tick();
    kit.tick();
    expect(ticks).toEqual([1]);
  });

  it('counts a second play as one', () => {
    const { kit, clock } = setUp();
    const ticks = collect(clock);
    clock.play();
    clock.play();
    kit.tick();
    expect(ticks).toEqual([1]);
  });
});

describe('the virtual-time driver', () => {
  it('runs a simulated second in no time at a fixed step', () => {
    const scheduler = new VirtualTimeScheduler();
    const kit = provideSceneClockTestKit();
    TestBed.configureTestingModule({
      providers: [
        ...kit.providers,
        { provide: SceneClockDriverToken, useValue: virtualTimeDriver(scheduler) },
      ],
    });
    const clock = TestBed.inject(SceneClock);
    const ticks = collect(clock);
    clock.play();
    scheduler.maxFrames = 1000;
    scheduler.flush();
    expect(ticks).toHaveLength(60);
    expect(ticks.every((steps) => steps === 1)).toBe(true);
  });
});
