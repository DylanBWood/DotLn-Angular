import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { catalogDiagnostic, checkCatalog, dataDirectory } from './check-catalog.mjs';

try {
  const checkpoints = checkCatalog();
  const tools = checkpoints.flatMap((checkpoint) => checkpoint.tools);
  const summary = JSON.parse(readFileSync(resolve(dataDirectory, 'catalog-summary.json'), 'utf8'));
  console.log(
    `Catalog: ${summary.totalRows} tools; ${summary.mappedRows} mapped rows; ${summary.maps.length} maps; ${checkpoints.length} checkpoints.`,
  );
  for (const [dimension, counts] of Object.entries(summary.counts))
    console.log(
      `${dimension}: ${Object.entries(counts)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ')}`,
    );
  for (const work of summary.works) {
    console.log(`${work.work} — ${work.sceneType}; typed shortfall: ${work.typedShortfall}`);
    const relations = tools
      .filter((tool) => tool.work === work.work)
      .flatMap((tool) => tool.related);
    const resolved = relations.filter((relation) => relation.id !== null).length;
    const share = relations.length ? ((resolved / relations.length) * 100).toFixed(1) : '0.0';
    console.log(
      `  relations: ${resolved}/${relations.length} resolved (${share}%); scene tools: ${work.sceneTools.length}`,
    );
    for (const id of work.sceneTools) {
      const tool = tools.find((candidate) => candidate.id === id);
      console.log(`  ${id} | ${tool.title} | ${tool.faces.transform.kind}`);
    }
  }
} catch (error) {
  console.error(`FAIL catalog report: ${catalogDiagnostic(error)}`);
  process.exitCode = 1;
}
