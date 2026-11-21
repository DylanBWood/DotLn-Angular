export const guideEvents = [
  'runOpened',
  'guideRead',
  'writeRefused',
  'linksChecked',
  'gatePassed',
] as const;

export type GuideEvent = (typeof guideEvents)[number];

export interface EventChunk {
  readonly members: readonly GuideEvent[];
  readonly refusalCount: number;
}

interface GuideCheck {
  readonly chunkCount: number;
  readonly eventCount: number;
  readonly refusalCount: number;
}

export interface ChunkingRun {
  readonly events: readonly GuideEvent[];
  readonly chunkSize: number;
  readonly chunks: readonly EventChunk[];
  readonly guideCheck: GuideCheck;
}

function summarize(chunks: readonly EventChunk[]): GuideCheck {
  let eventCount = 0;
  let refusalCount = 0;
  for (const chunk of chunks) {
    eventCount += chunk.members.length;
    refusalCount += chunk.refusalCount;
  }
  return { chunkCount: chunks.length, eventCount, refusalCount };
}

export function runChunking(events: readonly GuideEvent[], chunkSize: number): ChunkingRun {
  if (!Number.isSafeInteger(chunkSize) || chunkSize < 1) {
    throw new RangeError('Chunk size must be a positive safe integer.');
  }

  const recording = [...events];
  const chunks: EventChunk[] = [];
  for (let start = 0; start < recording.length; start += chunkSize) {
    const members = recording.slice(start, start + chunkSize);
    const refusalCount = members.filter((event) => event === 'writeRefused').length;
    chunks.push({ members, refusalCount });
  }

  return { events: recording, chunkSize, chunks, guideCheck: summarize(chunks) };
}
