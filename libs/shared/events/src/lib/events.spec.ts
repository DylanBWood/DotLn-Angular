import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import * as groups from '../public_api';

it('gives each group a unique source and the prefix of its directory tier', () => {
  const files = import.meta.glob('./{app,navigation,data-access,ui}/*.ts', { eager: true });
  const sources = new Set<string>();
  for (const [path, exports] of Object.entries(files)) {
    const tier = path.split('/')[1];
    for (const group of Object.values(
      exports as Record<string, Record<string, { type: string }>>,
    )) {
      const types = Object.values(group).map((creator) => creator.type);
      const source = types[0].split(']')[0].slice(1);
      expect(source.toLowerCase().startsWith(tier + ' ')).toBe(true);
      expect(sources.has(source)).toBe(false);
      expect(types.every((type) => type.startsWith(`[${source}] `))).toBe(true);
      sources.add(source);
    }
  }
  expect(sources.size).toBe(Object.keys(groups).length);
  const creators = Object.values(groups).flatMap((group) => Object.values(group));
  expect(new Set(creators.map((creator) => creator.type)).size).toBe(creators.length);
  expect(readFileSync(resolve(import.meta.dirname, 'ui/board-page-events.ts'), 'utf8')).toContain(
    'eventGroup(',
  );
});
