import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import type { PreviewArrow, SceneFrame, UnitId, Vec2 } from '@dotln-angular/scene-engine';

import { provideSceneRendererFactoryTokenTestKit } from '../../../../testing/src';
import { fieldView, toField, toScreen, unitAt } from './field-view';
import { type FieldMarquee, type FieldSelect, SceneCanvas } from './scene-canvas';

const frame = (frameNo = 0): SceneFrame => ({
  frameNo,
  field: { width: 100, height: 100 },
  units: [
    {
      id: 'a',
      position: { x: 10, y: 10 },
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
});

@Component({
  selector: 'scene-canvas-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <scene-canvas
      [frames]="frames"
      [selection]="selection()"
      [arrows]="arrows()"
      [ghostFrames]="ghostFrames()"
      (selected)="selects.push($event)"
      (marquee)="marquees.push($event)"
      (pointAt)="points.push($event)"
      (sendTo)="sent.push($event)"
      (squad)="squads.push($event)"
    >
      <p class="projected"></p>
    </scene-canvas>
  `,
  imports: [SceneCanvas],
})
class CanvasHost {
  readonly frames = new BehaviorSubject<SceneFrame>(frame());
  readonly selection = signal<readonly UnitId[]>([]);
  readonly arrows = signal<readonly PreviewArrow[]>([]);
  readonly ghostFrames = signal<readonly SceneFrame[]>([]);
  readonly selects: FieldSelect[] = [];
  readonly marquees: FieldMarquee[] = [];
  readonly points: Vec2[] = [];
  readonly sent: Vec2[] = [];
  readonly squads: UnitId[] = [];
}

function setUp() {
  const kit = provideSceneRendererFactoryTokenTestKit();
  TestBed.configureTestingModule({ imports: [CanvasHost], providers: [...kit.providers] });
  const fixture = TestBed.createComponent(CanvasHost);
  fixture.detectChanges();
  TestBed.tick();
  const canvas: HTMLCanvasElement = fixture.nativeElement.querySelector('canvas');
  // jsdom lays nothing out, so give the surface the size a browser would: 1 pixel per unit.
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
  canvas.setPointerCapture = () => undefined;
  return { kit, fixture, canvas, host: fixture.componentInstance };
}

const pointer = (type: string, clientX: number, clientY: number, init: PointerEventInit = {}) =>
  new PointerEvent(type, { clientX, clientY, button: 0, bubbles: true, ...init });

describe('the field wrapper', () => {
  it('owns the only drawing surface and paints each frame it is sent, directly', () => {
    const { kit, host, fixture } = setUp();
    expect(fixture.nativeElement.querySelectorAll('canvas')).toHaveLength(1);
    const before = kit.renderer.draws;
    host.frames.next(frame(1));
    host.frames.next(frame(2));
    expect(kit.renderer.draws).toBe(before + 2);
    expect(kit.renderer.last?.frame.frameNo).toBe(2);
  });

  it('repaints a still frame when the selection changes', () => {
    const { kit, host } = setUp();
    host.selection.set(['a']);
    TestBed.tick();
    expect(kit.renderer.last?.selection).toEqual(['a']);
  });

  it('hands the painter the other branch’s units, frame for frame', () => {
    const { kit, host } = setUp();
    const moved = { ...frame(1).units[0], id: 'moved' };
    host.ghostFrames.set([frame(0), { ...frame(1), units: [moved] }]);
    TestBed.tick();
    expect(kit.renderer.last?.ghost?.units[0].id).toBe('a');
    host.frames.next(frame(1));
    expect(kit.renderer.last?.ghost?.units[0].id).toBe('moved');
    host.frames.next(frame(50));
    expect(kit.renderer.last?.ghost?.units[0].id).toBe('moved');
  });

  it('passes no ghost when there is nothing faint to draw', () => {
    const { kit } = setUp();
    expect(kit.renderer.last?.ghost).toBeNull();
  });

  it('hands the painter a preview’s arrows', () => {
    const { kit, host } = setUp();
    const arrow = { id: 'a', position: { x: 0, y: 0 }, acceleration: { x: 1, y: 0 } };
    host.arrows.set([arrow]);
    TestBed.tick();
    expect(kit.renderer.last?.ghost?.arrows).toEqual([arrow]);
  });

  it('reports a press on a unit', () => {
    const { host, canvas } = setUp();
    canvas.dispatchEvent(pointer('pointerdown', 10, 10));
    canvas.dispatchEvent(pointer('pointerup', 10, 10));
    expect(host.selects).toEqual([{ id: 'a', additive: false }]);
    expect(host.points).toEqual([]);
  });

  it('reports a shift-press as adding', () => {
    const { host, canvas } = setUp();
    canvas.dispatchEvent(pointer('pointerdown', 10, 10, { shiftKey: true }));
    canvas.dispatchEvent(pointer('pointerup', 10, 10));
    expect(host.selects).toEqual([{ id: 'a', additive: true }]);
  });

  it('reports a press on open ground as a point on the field', () => {
    const { host, canvas } = setUp();
    canvas.dispatchEvent(pointer('pointerdown', 70, 80));
    canvas.dispatchEvent(pointer('pointerup', 70, 80));
    expect(host.points).toEqual([{ x: 70, y: 80 }]);
    expect(host.selects).toEqual([]);
  });

  it('treats a drag as a marquee, drawn while it lasts', () => {
    const { host, canvas, fixture } = setUp();
    canvas.dispatchEvent(pointer('pointerdown', 5, 5));
    canvas.dispatchEvent(pointer('pointermove', 50, 60));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.marquee')).not.toBeNull();
    canvas.dispatchEvent(pointer('pointerup', 50, 60));
    fixture.detectChanges();
    expect(host.marquees).toEqual([
      { from: { x: 5, y: 5 }, to: { x: 50, y: 60 }, additive: false },
    ]);
    expect(host.selects).toEqual([]);
    expect(fixture.nativeElement.querySelector('.marquee')).toBeNull();
  });

  it('forgives a press that shifts by a pixel or two', () => {
    const { host, canvas } = setUp();
    canvas.dispatchEvent(pointer('pointerdown', 10, 10));
    canvas.dispatchEvent(pointer('pointermove', 12, 11));
    canvas.dispatchEvent(pointer('pointerup', 12, 11));
    expect(host.marquees).toEqual([]);
    expect(host.selects).toHaveLength(1);
  });

  it('turns a right-click into an order, not the browser’s menu', () => {
    const { host, canvas } = setUp();
    const event = new MouseEvent('contextmenu', {
      clientX: 40,
      clientY: 30,
      bubbles: true,
      cancelable: true,
    });
    canvas.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(host.sent).toEqual([{ x: 40, y: 30 }]);
  });

  it('ignores a right button press as the start of a marquee', () => {
    const { host, canvas } = setUp();
    canvas.dispatchEvent(pointer('pointerdown', 5, 5, { button: 2 }));
    canvas.dispatchEvent(pointer('pointermove', 50, 60));
    canvas.dispatchEvent(pointer('pointerup', 50, 60));
    expect(host.marquees).toEqual([]);
  });

  it('reports a double press on a unit', () => {
    const { host, canvas } = setUp();
    canvas.dispatchEvent(new MouseEvent('dblclick', { clientX: 10, clientY: 10, bubbles: true }));
    expect(host.squads).toEqual(['a']);
  });

  it('lets content sit over the field', () => {
    const { fixture } = setUp();
    expect(fixture.nativeElement.querySelector('scene-canvas .projected')).not.toBeNull();
  });

  it('gives the painter up with the page', () => {
    const { kit, fixture } = setUp();
    fixture.destroy();
    expect(kit.renderer.disposed).toBe(true);
  });
});

describe('the field view', () => {
  const field = { width: 120, height: 80 };

  it('centres the field at one scale', () => {
    expect(fieldView(600, 600, field)).toEqual({ scale: 5, left: 0, top: 100 });
    expect(fieldView(1200, 400, field)).toEqual({ scale: 5, left: 300, top: 0 });
  });

  it('round-trips a point', () => {
    const view = fieldView(600, 600, field);
    expect(toField(view, toScreen(view, { x: 12, y: 34 }))).toEqual({ x: 12, y: 34 });
  });

  it('stays finite on a surface with no size yet', () => {
    expect(fieldView(0, 0, field).scale).toBe(1);
  });

  it('finds the nearest unit in reach and nothing beyond it', () => {
    expect(unitAt(frame(), { x: 11, y: 10 }, 2)).toBe('a');
    expect(unitAt(frame(), { x: 50, y: 50 }, 2)).toBeNull();
  });
});
