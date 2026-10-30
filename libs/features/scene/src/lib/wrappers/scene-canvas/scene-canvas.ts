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

import type { PreviewArrow, SceneFrame, UnitId, Vec2 } from '@dotln-angular/scene-engine';

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

interface Press {
  readonly x: number;
  readonly y: number;
  readonly additive: boolean;
}

// A press that moves further than this, in pixels, is a marquee and not a click.
const dragThreshold = 5;
// How far from a unit's centre a press still lands on it, in pixels, for fingers and small units.
const pressReach = 14;

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

  readonly selected = output<FieldSelect>();
  readonly marquee = output<FieldMarquee>();
  readonly pointAt = output<Vec2>();
  readonly sendTo = output<Vec2>();
  readonly squad = output<UnitId>();

  protected readonly surface = viewChild.required<ElementRef<HTMLCanvasElement>>('surface');
  readonly #document = inject(DOCUMENT);
  readonly #createRenderer = inject(SceneRendererFactoryToken);
  readonly #dragged = signal<{
    readonly from: Press;
    readonly x: number;
    readonly y: number;
  } | null>(null);
  #press: Press | null = null;
  #renderer: SceneRenderer | null = null;
  #frame: SceneFrame | null = null;

  protected readonly marqueeBox = computed(() => {
    const dragged = this.#dragged();
    if (!dragged) return null;
    const { from, x, y } = dragged;
    return {
      left: Math.min(from.x, x),
      top: Math.min(from.y, y),
      width: Math.abs(x - from.x),
      height: Math.abs(y - from.y),
    };
  });

  constructor() {
    effect((onCleanup) => {
      const canvas = this.surface().nativeElement;
      const renderer = this.#createRenderer(canvas, {
        styles: () => untracked(this.units),
        motion: () => untracked(this.motion),
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
    const units = frames[Math.min(frameNo - first, frames.length - 1)]?.units ?? [];
    return arrows.length === 0 && units.length === 0 ? null : { arrows, units };
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
      this.#dragged.set({ from: press, x, y });
  }

  release(event: PointerEvent) {
    const press = this.#press;
    const dragged = this.#dragged();
    this.cancel();
    if (!press) return;
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

  /** The strategy game's right-click: an order to go there, in place of the browser's menu. */
  send(event: MouseEvent) {
    event.preventDefault();
    const landed = this.#toField(this.#local(event));
    if (landed) this.sendTo.emit(landed.point);
  }

  doublePress(event: MouseEvent) {
    const unit = this.#landing(this.#local(event))?.unit ?? null;
    if (unit !== null) this.squad.emit(unit);
  }
}
