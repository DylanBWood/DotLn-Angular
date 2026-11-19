import {
  type BulletState,
  impactFrames,
  type SceneFrame,
  type UnitId,
} from '@dotln-angular/scene-engine';

import { type FieldView, toScreen } from './field-view';

/** Short ink strokes radiate from a hollow centre so the struck glyph stays legible. */
function spark(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  context.beginPath();
  for (let ray = 0; ray < 8; ray++) {
    const angle = (ray * Math.PI) / 4;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const end = ray % 2 === 0 ? radius : radius * 0.72;
    context.moveTo(x + dx * end * 0.48, y + dy * end * 0.48);
    context.lineTo(x + dx * end, y + dy * end);
  }
  context.stroke();
}

/** A flat nick with two chips gives geometry its own signature at phone scale. */
function wallMark(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  context.beginPath();
  context.moveTo(x - size, y + size * 0.65);
  context.lineTo(x + size, y - size * 0.65);
  context.moveTo(x - size, y - size);
  context.lineTo(x - size * 0.55, y - size * 0.5);
  context.moveTo(x + size * 0.6, y + size * 0.55);
  context.lineTo(x + size, y + size);
  context.stroke();
}

function streak(shot: BulletState, view: FieldView) {
  const { x, y } = toScreen(view, shot.position);
  const speed = Math.hypot(shot.velocity.x, shot.velocity.y) || 1;
  const tail = Math.min(22, Math.max(7, (speed * view.scale) / 24));
  const dx = (shot.velocity.x * tail) / speed;
  const dy = (shot.velocity.y * tail) / speed;
  return { x, y, dx, dy };
}

export function paintGhostShots(
  context: CanvasRenderingContext2D,
  shots: readonly BulletState[],
  view: FieldView,
  colour: string,
) {
  if (!shots.length) return;
  context.save();
  context.strokeStyle = colour;
  context.lineWidth = 2;
  context.setLineDash([3, 2]);
  context.beginPath();
  for (const shot of shots) {
    const { x, y, dx, dy } = streak(shot, view);
    context.moveTo(x - dx, y - dy);
    context.lineTo(x, y);
  }
  context.stroke();
  context.restore();
}

export function paintShots(
  context: CanvasRenderingContext2D,
  frame: SceneFrame,
  view: FieldView,
  colours: ReadonlyMap<UnitId, string>,
  palette: { readonly ink: string; readonly objective: string },
  motion: boolean,
) {
  if (!frame.bullets.length && !frame.impacts.length) return;
  context.save();
  context.lineCap = 'round';
  for (const shot of frame.bullets) {
    const { x, y, dx, dy } = streak(shot, view);
    context.strokeStyle = colours.get(shot.owner) ?? palette.ink;
    context.globalAlpha = 0.45;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(x - dx, y - dy);
    context.lineTo(x, y);
    context.stroke();
    context.globalAlpha = 1;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(x - dx * 0.45, y - dy * 0.45);
    context.lineTo(x, y);
    context.stroke();
    context.fillStyle = palette.ink;
    context.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
  }
  for (const mark of frame.impacts) {
    const { x, y } = toScreen(view, mark.position);
    const phase = motion ? (frame.frameNo - mark.at) / impactFrames : 0;
    context.globalAlpha = 1 - phase * 0.85;
    context.lineWidth = 1.8;
    if (mark.unitId === null) {
      context.strokeStyle = palette.objective;
      wallMark(context, x, y, 4.5);
    } else {
      context.strokeStyle = palette.ink;
      spark(context, x, y, 8 + phase * 6);
    }
  }
  context.restore();
}
