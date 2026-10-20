import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { workspaceRoot } from './source-files.mjs';

for (const library of ['core', 'utils', 'i18n']) {
  for (const kind of ['lib', 'spec']) {
    const config = `libs/shared/${library}/tsconfig.${kind}.json`;
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
