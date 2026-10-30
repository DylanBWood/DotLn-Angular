export interface RandomDraw {
  readonly value: number;
  readonly seed: number;
}

// A mulberry32 step. The generator's state is the seed it returns, so a run is reproducible
// from its starting seed and a simulation state stays a plain value.
export function nextRandom(seed: number): RandomDraw {
  const next = (seed + 0x6d2b79f5) | 0;
  let mixed = Math.imul(next ^ (next >>> 15), 1 | next);
  mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
  return { value: ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296, seed: next };
}

/** A random binomial: the difference of two uniform draws, in -1 to 1 and favouring zero. */
export function nextBinomial(seed: number): RandomDraw {
  const first = nextRandom(seed);
  const second = nextRandom(first.seed);
  return { value: first.value - second.value, seed: second.seed };
}
