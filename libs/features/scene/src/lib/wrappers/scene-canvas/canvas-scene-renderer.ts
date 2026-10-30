import type {
  PreviewArrow,
  SceneFrame,
  UnitFrame,
  UnitId,
  Vec2,
} from '@dotln-angular/scene-engine';

import type {
  SceneGhost,
  SceneRenderer,
  SceneRendererOptions,
} from '../../renderers/scene-renderer';
import { type FieldView, fieldView, toScreen } from './field-view';

const trailLength = 30;
// A trail is stroked in a few bands of fading strength, not one stroke per segment.
const trailBands = 4;
const trailStrength = 0.5;
// A glyph is never smaller than can be read at a glance on a small field.
const smallestGlyph = 4.5;
const ringGap = 4;
const labelGap = 4;
const labelHeight = 12;
const arrowScale = 1;
const groundStep = 10;
const rippleFrames = 45;
const rippleGrowth = 1.6;
// A frame number that leaps was a rewind or a replay, and a trail across it would be false.
const trailBreak = 8;

/** The tokens the painter draws with, read when the surface is sized rather than every frame. */
interface PaintTokens {
  readonly read: (name: string) => string;
  readonly ground: string;
  readonly line: string;
  readonly muted: string;
  readonly ink: string;
  readonly accent: string;
  readonly objective: string;
  readonly ghost: string;
  readonly alert: string;
  readonly font: string;
}

function readTokens(element: Element): PaintTokens {
  const style = getComputedStyle(element);
  const read = (name: string) => style.getPropertyValue(name).trim();
  return {
    read,
    ground: read('--dotln-field-ground'),
    line: read('--dotln-field-line'),
    muted: read('--dotln-field-muted'),
    ink: read('--dotln-field-ink'),
    accent: read('--dotln-field-accent'),
    objective: read('--dotln-field-objective'),
    ghost: read('--dotln-field-ghost'),
    alert: read('--dotln-field-alert'),
    font: read('--dotln-font'),
  };
}

const glyphRadius = (unit: UnitFrame, view: FieldView) =>
  Math.max(smallestGlyph, unit.radius * view.scale);

interface LabelBox {
  readonly left: number;
  readonly right: number;
  readonly top: number;
}

const overlaps = (a: LabelBox, b: LabelBox) =>
  a.left < b.right && b.left < a.right && Math.abs(a.top - b.top) < labelHeight;

const covers = (box: LabelBox, point: Vec2) =>
  point.x > box.left && point.x < box.right && point.y > box.top && point.y < box.top + labelHeight;

/** Paints a frame onto a 2D context in one pass, with no retained element per unit. */
export class CanvasSceneRenderer implements SceneRenderer {
  readonly #canvas: HTMLCanvasElement;
  readonly #context: CanvasRenderingContext2D;
  readonly #options: SceneRendererOptions;
  readonly #trails = new Map<UnitId, readonly Vec2[]>();
  #tokens: PaintTokens;
  #roles = new Map<string, string>();
  #width = 0;
  #height = 0;
  #ratio = 1;
  #lastFrame = -1;
  #objective: Vec2 | null = null;
  #objectiveFrame = -rippleFrames;

  constructor(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    options: SceneRendererOptions,
  ) {
    this.#canvas = canvas;
    this.#context = context;
    this.#options = options;
    this.#tokens = readTokens(canvas);
  }

  resize(width: number, height: number, pixelRatio: number) {
    this.#width = width;
    this.#height = height;
    this.#ratio = pixelRatio;
    this.#canvas.width = Math.round(width * pixelRatio);
    this.#canvas.height = Math.round(height * pixelRatio);
    this.#tokens = readTokens(this.#canvas);
    this.#roles = new Map();
  }

  dispose() {
    this.#trails.clear();
  }

  draw(frame: SceneFrame, selection: readonly UnitId[], ghost: SceneGhost | null = null) {
    const view = fieldView(this.#width, this.#height, frame.field);
    this.#context.setTransform(this.#ratio, 0, 0, this.#ratio, 0, 0);
    this.#paintGround(frame, view);
    this.#paintObjective(frame, view);
    this.#paintFormation(frame, view);
    if (ghost) this.#paintGhostUnits(ghost.units, view);
    this.#paintTrails(frame, view);
    this.#paintUnits(frame, selection, view);
    this.#paintCollisions(frame, view);
    if (ghost) this.#paintArrows(ghost.arrows, view);
    this.#lastFrame = frame.frameNo;
  }

  #paintGround(frame: SceneFrame, view: FieldView) {
    const context = this.#context;
    const { ground, line } = this.#tokens;
    const { width, height } = frame.field;
    context.fillStyle = ground;
    context.fillRect(0, 0, this.#width, this.#height);
    context.fillStyle = line;
    for (let x = groundStep; x < width; x += groundStep) {
      for (let y = groundStep; y < height; y += groundStep) {
        const dot = toScreen(view, { x, y });
        context.fillRect(dot.x - 0.75, dot.y - 0.75, 1.5, 1.5);
      }
    }
    context.strokeStyle = line;
    context.lineWidth = 1;
    context.strokeRect(
      view.left + 0.5,
      view.top + 0.5,
      width * view.scale - 1,
      height * view.scale - 1,
    );
  }

  #paintObjective(frame: SceneFrame, view: FieldView) {
    const { objective } = frame;
    if (objective === null) {
      this.#objective = null;
      return;
    }
    if (objective.x !== this.#objective?.x || objective.y !== this.#objective?.y)
      this.#objectiveFrame = frame.frameNo;
    this.#objective = objective;
    const context = this.#context;
    const { x, y } = toScreen(view, objective);
    context.strokeStyle = this.#tokens.objective;
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(x, y, 9, 0, 2 * Math.PI);
    context.moveTo(x - 14, y);
    context.lineTo(x - 5, y);
    context.moveTo(x + 5, y);
    context.lineTo(x + 14, y);
    context.moveTo(x, y - 14);
    context.lineTo(x, y - 5);
    context.moveTo(x, y + 5);
    context.lineTo(x, y + 14);
    context.stroke();

    const age = frame.frameNo - this.#objectiveFrame;
    if (this.#options.motion() && age >= 0 && age < rippleFrames) {
      context.globalAlpha = 1 - age / rippleFrames;
      context.beginPath();
      context.arc(x, y, 9 + age * rippleGrowth, 0, 2 * Math.PI);
      context.stroke();
      context.globalAlpha = 1;
    }
  }

  #paintFormation(frame: SceneFrame, view: FieldView) {
    const context = this.#context;
    const { muted, line } = this.#tokens;
    context.strokeStyle = line;
    context.lineWidth = 1;
    for (const slot of frame.slots) {
      const { x, y } = toScreen(view, slot);
      context.beginPath();
      context.arc(x, y, 4, 0, 2 * Math.PI);
      context.stroke();
    }
    context.fillStyle = muted;
    for (const anchor of frame.anchors) {
      const { x, y } = toScreen(view, anchor);
      context.beginPath();
      context.moveTo(x, y - 5);
      context.lineTo(x + 5, y);
      context.lineTo(x, y + 5);
      context.lineTo(x - 5, y);
      context.closePath();
      context.fill();
    }
  }

  /** An arrowhead along the unit's heading: it reads as something going somewhere. */
  #traceGlyph(unit: UnitFrame, view: FieldView) {
    const context = this.#context;
    const { x, y } = toScreen(view, unit.position);
    const size = glyphRadius(unit, view);
    const { x: forward, y: across } = unit.heading;
    const nose = 1.7 * size;
    const tail = 1.1 * size;
    const wing = 1.05 * size;
    const notch = 0.45 * size;
    context.beginPath();
    context.moveTo(x + forward * nose, y + across * nose);
    context.lineTo(x - forward * tail - across * wing, y - across * tail + forward * wing);
    context.lineTo(x - forward * notch, y - across * notch);
    context.lineTo(x - forward * tail + across * wing, y - across * tail - forward * wing);
    context.closePath();
  }

  #paintGhostUnits(units: readonly UnitFrame[], view: FieldView) {
    const context = this.#context;
    context.fillStyle = this.#tokens.ghost;
    for (const unit of units) {
      this.#traceGlyph(unit, view);
      context.fill();
    }
  }

  #paintTrails(frame: SceneFrame, view: FieldView) {
    if (!this.#options.motion()) {
      this.#trails.clear();
      return;
    }
    const gap = frame.frameNo - this.#lastFrame;
    if (gap < 0 || gap > trailBreak) this.#trails.clear();
    const context = this.#context;
    const colours = this.#unitColours();
    context.lineWidth = 1.5;
    context.lineCap = 'round';
    for (const unit of frame.units) {
      const known = this.#trails.get(unit.id) ?? [];
      const moved = known.at(-1) !== unit.position;
      const trail = gap !== 0 && moved ? [...known, unit.position].slice(-trailLength) : known;
      this.#trails.set(unit.id, trail);
      context.strokeStyle = colours.get(unit.id) ?? this.#tokens.ink;
      for (let band = 0; band < trailBands; band += 1) {
        const from = Math.floor((band * (trail.length - 1)) / trailBands);
        const to = Math.floor(((band + 1) * (trail.length - 1)) / trailBands);
        if (to <= from) continue;
        context.globalAlpha = ((band + 1) / trailBands) * trailStrength;
        context.beginPath();
        for (let index = from; index <= to; index += 1) {
          const point = toScreen(view, trail[index]);
          if (index === from) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        }
        context.stroke();
      }
    }
    context.globalAlpha = 1;
  }

  /** A spark where two units overlap, so a collision is seen and not only counted. */
  #paintCollisions(frame: SceneFrame, view: FieldView) {
    const context = this.#context;
    context.strokeStyle = this.#tokens.alert;
    context.lineWidth = 1.5;
    for (const collision of frame.collisions) {
      const { x, y } = toScreen(view, collision);
      context.beginPath();
      context.arc(x, y, 7, 0, 2 * Math.PI);
      context.stroke();
    }
  }

  #roleColour(role: string) {
    const known = this.#roles.get(role);
    if (known) return known;
    const colour = this.#tokens.read(`--dotln-role-${role}`) || this.#tokens.ink;
    this.#roles.set(role, colour);
    return colour;
  }

  #unitColours() {
    return new Map(
      this.#options.styles().map(({ id, role }) => [id, this.#roleColour(role)] as const),
    );
  }

  #paintUnits(frame: SceneFrame, selection: readonly UnitId[], view: FieldView) {
    const context = this.#context;
    const selected = new Set(selection);
    const { accent, ink, objective, font } = this.#tokens;
    const colours = this.#unitColours();
    const labels = new Map(this.#options.styles().map(({ id, label }) => [id, label]));
    const placed: LabelBox[] = [];
    const centres = frame.units.map((unit) => toScreen(view, unit.position));
    context.font = `500 11px ${font}`;
    context.textAlign = 'center';
    context.textBaseline = 'top';
    for (const unit of frame.units) {
      const { x, y } = toScreen(view, unit.position);
      const colour = colours.get(unit.id) ?? ink;
      const size = glyphRadius(unit, view);
      const ring = selected.has(unit.id) ? size + ringGap : 0;
      if (ring > 0) {
        context.strokeStyle = accent;
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(x, y, ring, 0, 2 * Math.PI);
        context.stroke();
      }
      if (unit.activity === 'stalled') {
        context.strokeStyle = objective;
        context.lineWidth = 1.5;
        context.setLineDash([3, 3]);
        context.beginPath();
        context.arc(x, y, size + ringGap + 3, 0, 2 * Math.PI);
        context.stroke();
        context.setLineDash([]);
      }
      context.fillStyle = colour;
      this.#traceGlyph(unit, view);
      context.fill();
      // A crowded label yields to other labels and units; the text layer still has them all.
      const label = labels.get(unit.id);
      if (!label) continue;
      const half = context.measureText(label).width / 2;
      const top = y + Math.max(size * 1.7, ring) + labelGap;
      const box = { left: x - half, right: x + half, top };
      const crowded =
        placed.some((other) => overlaps(box, other)) ||
        centres.some((centre) => covers(box, centre));
      if (crowded) continue;
      placed.push(box);
      context.fillText(label, x, top);
    }
  }

  #paintArrows(arrows: readonly PreviewArrow[], view: FieldView) {
    const context = this.#context;
    context.strokeStyle = this.#tokens.ghost;
    context.lineWidth = 1.5;
    for (const { position, acceleration } of arrows) {
      const from = toScreen(view, position);
      const to = {
        x: from.x + acceleration.x * arrowScale,
        y: from.y + acceleration.y * arrowScale,
      };
      const size = Math.hypot(to.x - from.x, to.y - from.y);
      if (size < 2) continue;
      const along = { x: (to.x - from.x) / size, y: (to.y - from.y) / size };
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.lineTo(to.x - along.x * 6 - along.y * 4, to.y - along.y * 6 + along.x * 4);
      context.moveTo(to.x, to.y);
      context.lineTo(to.x - along.x * 6 + along.y * 4, to.y - along.y * 6 - along.x * 4);
      context.stroke();
    }
  }
}
