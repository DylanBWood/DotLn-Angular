import type { SceneMetrics } from '@dotln-angular/scene-engine';

import {
  instrumentIds,
  seriesPoints,
  sparklineFrames,
  sparklineHeight,
  sparklineWidth,
} from '../mappers/metric-mapper';
import type { InstrumentId } from '../models/scene-view-model';

/** The last 600 frames of each instrument. Reset when what is measured changes. */
export class MetricHistory {
  #series = new Map<InstrumentId, (number | null)[]>();

  record(metrics: SceneMetrics) {
    for (const id of instrumentIds) {
      const series = this.#series.get(id) ?? [];
      series.push(metrics[id]);
      if (series.length > sparklineFrames) series.shift();
      this.#series.set(id, series);
    }
  }

  reset() {
    this.#series = new Map();
  }

  points(): Readonly<Record<InstrumentId, string>> {
    return Object.fromEntries(
      instrumentIds.map((id) => [
        id,
        seriesPoints(this.#series.get(id) ?? [], sparklineWidth, sparklineHeight),
      ]),
    ) as Record<InstrumentId, string>;
  }
}
