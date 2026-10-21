import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { workspaceRoot } from './source-files.mjs';

for (const library of [
  'shared/core',
  'shared/utils',
  'shared/i18n',
  'shared/models',
  'shared/ui',
  'dotln/shell',
  'features/board',
]) {
  for (const kind of library === 'shared/models' ? ['lib'] : ['lib', 'spec']) {
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
