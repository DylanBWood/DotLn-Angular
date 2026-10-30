import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { workspaceRoot } from './source-files.mjs';

for (const library of [
  'shared/core',
  'shared/utils',
  'shared/i18n',
  'shared/models',
  'shared/catalog',
  'features/tools',
  'shared/ui',
  'dotln/shell',
  'features/board',
  'shared/scene-engine',
  'features/scene',
  'features/scene-data-access',
  'features/machinery',
  'shared/events',
  'shared/data-access',
  'shared/state',
  'features/board-data-access',
]) {
  for (const kind of ['lib', 'spec']) {
    const config = `libs/${library}/tsconfig.${kind}.json`;
    const result = spawnSync(
      process.execPath,
      [resolve(workspaceRoot, 'node_modules/typescript/bin/tsc'), '--noEmit', '-p', config],
      { cwd: workspaceRoot, stdio: 'inherit', timeout: 60_000 },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
    console.log(`PASS ${config}`);
  }
}
