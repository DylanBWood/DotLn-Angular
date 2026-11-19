import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type { Observable } from 'rxjs';

import type {
  PreviewArrow,
  SceneFrame,
  SearchRecord,
  UnitId,
  Vec2,
} from '@dotln-angular/scene-engine';

import type { FieldToolId } from '../../models/scene-view-model';
import type { SceneGhost, SceneRenderer, SceneUnitStyle } from '../../renderers/scene-renderer';
import { fieldView, toField, unitAt } from './field-view';
import { SceneRendererFactoryToken } from './scene-renderer-factory';

/** A press landing on a unit. */
export interface FieldSelect {
  readonly id: UnitId;
  readonly additive: boolean;
}

export interface FieldMarquee {
  readonly from: Vec2;
  readonly to: Vec2;
  readonly additive: boolean;
}

/** A wall drawn by a press, a drag and a release. */
export interface DrawnWall {
  readonly from: Vec2;
  readonly to: Vec2;
}

/** An obstacle placed by a click, or a press dragged out to its radius. */
export interface PlacedObstacle {
  readonly centre: Vec2;
  readonly radius?: number;
}

interface Press {
  readonly x: number;
  readonly y: number;
  readonly additive: boolean;
}

// A press that moves further than this, in pixels, is a marquee and not a click.
const dragThreshold = 5;
// How far from a unit's centre a press still lands on it, in pixels, for fingers and small units.
const pressReach = 14;
// A wall shorter than this, in field units, is a slip of the hand and draws nothing.
const shortestWall = 0.5;

// With Shift held, a drawn wall keeps to whichever axis it is closer to.
function snapped(from: Vec2, to: Vec2, snap: boolean): Vec2 {
  if (!snap) return to;
  return Math.abs(to.x - from.x) >= Math.abs(to.y - from.y)
    ? { x: to.x, y: from.y }
    : { x: from.x, y: to.y };
}

/** Owns the field's drawing surface and its painter; the frames arrive as a stream. */
@Component({
  selector: 'scene-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas
      #surface
      tabindex="0"
      role="img"
      translate="no"
      [attr.aria-label]="label()"
      (pointerdown)="press($event)"
      (pointermove)="drag($event)"
      (pointerup)="release($event)"
      (pointercancel)="cancel()"
      (dblclick)="doublePress($event)"
      (contextmenu)="send($event)"
    ></canvas>
    <ng-content />
    @if (marqueeBox(); as box) {
      <div
        class="marquee"
        [style.left.px]="box.left"
        [style.top.px]="box.top"
        [style.width.px]="box.width"
        [style.height.px]="box.height"
      ></div>
    }
    @if (draft(); as shape) {
      <svg class="draft" aria-hidden="true">
        @if (shape.radius === null) {
          <line [attr.x1]="shape.from.x" [attr.y1]="shape.from.y" [attr.x2]="shape.to.x" [attr.y2]="shape.to.y" />
        } @else {
          <circle [attr.cx]="shape.from.x" [attr.cy]="shape.from.y" [attr.r]="shape.radius" />
        }
      </svg>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      inline-size: 100%;
      block-size: 100%;
      min-block-size: 0;
      overflow: hidden;
    }
    canvas {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      touch-action: none;
      cursor: crosshair;
    }
    canvas:focus-visible {
      outline: var(--dotln-focus);
      outline-offset: -3px;
    }
    .marquee {
      position: absolute;
      border: 1px solid var(--dotln-field-accent);
      background: color-mix(in srgb, var(--dotln-field-accent) 12%, transparent);
      pointer-events: none;
    }
    .draft {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      pointer-events: none;
      stroke: var(--dotln-field-wall);
      stroke-width: 4;
      stroke-linecap: round;
      fill: color-mix(in srgb, var(--dotln-field-wall) 35%, transparent);
    }
  `,
})
export class SceneCanvas {
  readonly frames = input.required<Observable<SceneFrame>>();
  readonly selection = input<readonly UnitId[]>([]);
  /** A preview's arrows, drawn faintly on the current frame. */
  readonly arrows = input<readonly PreviewArrow[]>([]);
  /** Another branch's frames: its units are drawn faintly under this one's, frame for frame. */
  readonly ghostFrames = input<readonly SceneFrame[]>([]);
  readonly units = input<readonly SceneUnitStyle[]>([]);
  readonly motion = input(true);
  readonly label = input('');
  /** What a press on the field does: select units, draw a wall or place an obstacle. */
  readonly fieldTool = input<FieldToolId>('select');
  /** The search the field shades, or none. */
  readonly search = input<SearchRecord | null>(null);

  readonly selected = output<FieldSelect>();
  readonly marquee = output<FieldMarquee>();
  readonly pointAt = output<Vec2>();
  readonly sendTo = output<Vec2>();
  readonly squad = output<UnitId>();
  readonly wallDrawn = output<DrawnWall>();
  readonly obstaclePlaced = output<PlacedObstacle>();

  protected readonly surface = viewChild.required<ElementRef<HTMLCanvasElement>>('surface');
  readonly #document = inject(DOCUMENT);
  readonly #createRenderer = inject(SceneRendererFactoryToken);
  readonly #dragged = signal<{
    readonly from: Press;
    readonly x: number;
    readonly y: number;
    readonly snap: boolean;
  } | null>(null);
  #press: Press | null = null;
  #renderer: SceneRenderer | null = null;
  #frame: SceneFrame | null = null;

  protected readonly marqueeBox = computed(() => {
    const dragged = this.#dragged();
    if (!dragged || this.fieldTool() !== 'select') return null;
    const { from, x, y } = dragged;
    return {
      left: Math.min(from.x, x),
      top: Math.min(from.y, y),
      width: Math.abs(x - from.x),
      height: Math.abs(y - from.y),
    };
  });

  /** The wall or obstacle being drawn, in the surface's pixels; a wall has no radius. */
  protected readonly draft = computed(() => {
    const dragged = this.#dragged();
    const tool = this.fieldTool();
    if (!dragged || tool === 'select') return null;
    const from = { x: dragged.from.x, y: dragged.from.y };
    const to = snapped(from, { x: dragged.x, y: dragged.y }, dragged.snap);
    return {
      from,
      to,
      radius: tool === 'wall' ? null : Math.hypot(to.x - from.x, to.y - from.y),
    };
  });

  constructor() {
    effect((onCleanup) => {
      const canvas = this.surface().nativeElement;
      const renderer = this.#createRenderer(canvas, {
        styles: () => untracked(this.units),
        motion: () => untracked(this.motion),
        search: () => untracked(this.search),
      });
      this.#renderer = renderer;
      const stopResizing = this.#observeSize(canvas, renderer);
      onCleanup(() => {
        stopResizing();
        renderer.dispose();
      });
    });

    effect((onCleanup) => {
      const subscription = this.frames().subscribe((frame) => {
        this.#frame = frame;
        this.#paint();
      });
      onCleanup(() => subscription.unsubscribe());
    });

    // Selection and ghosts change between frames, so a still scene repaints for them too.
    effect(() => {
      this.selection();
      this.arrows();
      this.ghostFrames();
      this.units();
      this.search();
      this.#paint();
    });
  }

  #observeSize(canvas: HTMLCanvasElement, renderer: SceneRenderer) {
    const view = this.#document.defaultView;
    const measure = () => {
      const { width, height } = canvas.getBoundingClientRect();
      renderer.resize(width, height, view?.devicePixelRatio ?? 1);
      this.#paint();
    };
    measure();
    if (!view || !('ResizeObserver' in view)) return () => undefined;
    const observer = new view.ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }

  #ghost(frameNo: number): SceneGhost | null {
    const arrows = untracked(this.arrows);
    const frames = untracked(this.ghostFrames);
    const first = frames[0]?.frameNo ?? 0;
    // Past the end of its window the ghost stands where it finished.
    const offset = frameNo - first;
    const units = frames[Math.min(offset, frames.length - 1)]?.units ?? [];
    const bullets = frames[offset]?.bullets ?? [];
    return arrows.length === 0 && units.length === 0 ? null : { arrows, units, bullets };
  }

  #paint() {
    if (this.#renderer && this.#frame)
      this.#renderer.draw(this.#frame, untracked(this.selection), this.#ghost(this.#frame.frameNo));
  }

  #local(event: MouseEvent) {
    const { left, top } = this.surface().nativeElement.getBoundingClientRect();
    return { x: event.clientX - left, y: event.clientY - top };
  }

  #toField(point: Vec2) {
    const { width, height } = this.surface().nativeElement.getBoundingClientRect();
    const frame = this.#frame;
    if (!frame) return null;
    const view = fieldView(width, height, frame.field);
    return { frame, view, point: toField(view, point) };
  }

  /** The unit a press lands on, and where on the field it landed. */
  #landing(local: Vec2) {
    const landed = this.#toField(local);
    if (!landed) return null;
    const { frame, view, point } = landed;
    return { point, unit: unitAt(frame, point, pressReach / view.scale) };
  }

  press(event: PointerEvent) {
    if (event.button !== 0) return;
    this.#press = { ...this.#local(event), additive: event.shiftKey };
    const canvas = this.surface().nativeElement;
    canvas.setPointerCapture?.(event.pointerId);
    canvas.focus({ preventScroll: true });
  }

  drag(event: PointerEvent) {
    const press = this.#press;
    const point = this.#local(event);
    if (!press) {
      const over = this.#landing(point)?.unit;
      this.surface().nativeElement.style.cursor = over ? 'pointer' : '';
      return;
    }
    const { x, y } = point;
    if (this.#dragged() || Math.hypot(x - press.x, y - press.y) > dragThreshold)
      this.#dragged.set({ from: press, x, y, snap: event.shiftKey });
  }

  release(event: PointerEvent) {
    const press = this.#press;
    const dragged = this.#dragged();
    this.cancel();
    if (!press) return;
    const tool = untracked(this.fieldTool);
    if (tool !== 'select') {
      this.#draw(tool, press, dragged ? this.#local(event) : null, event.shiftKey);
      return;
    }
    if (dragged) {
      const from = this.#toField(press);
      const to = this.#toField(this.#local(event));
      if (from && to)
        this.marquee.emit({ from: from.point, to: to.point, additive: press.additive });
      return;
    }
    const landed = this.#landing(this.#local(event));
    if (!landed) return;
    if (landed.unit === null) this.pointAt.emit(landed.point);
    else this.selected.emit({ id: landed.unit, additive: press.additive });
  }

  cancel() {
    this.#press = null;
    this.#dragged.set(null);
  }

  // A wall runs from the press to the release; an obstacle stands at the press, as wide as the
  // drag, or at its usual size when the press was a click.
  #draw(tool: Exclude<FieldToolId, 'select'>, press: Press, release: Vec2 | null, snap: boolean) {
    const from = this.#toField(press)?.point;
    if (!from) return;
    if (tool === 'obstacle') {
      const edge = release === null ? null : this.#toField(release)?.point;
      const radius = edge ? Math.hypot(edge.x - from.x, edge.y - from.y) : undefined;
      this.obstaclePlaced.emit(radius === undefined ? { centre: from } : { centre: from, radius });
      return;
    }
    const end = release === null ? null : this.#toField(snapped(press, release, snap))?.point;
    if (end && Math.hypot(end.x - from.x, end.y - from.y) >= shortestWall)
      this.wallDrawn.emit({ from, to: end });
  }

  /** The strategy game's right-click: an order to go there, in place of the browser's menu. */
  send(event: MouseEvent) {
    event.preventDefault();
    const landed = this.#toField(this.#local(event));
    if (landed) this.sendTo.emit(landed.point);
  }

  doublePress(event: MouseEvent) {
    if (untracked(this.fieldTool) !== 'select') return;
    const unit = this.#landing(this.#local(event))?.unit ?? null;
    if (unit !== null) this.squad.emit(unit);
  }
}
