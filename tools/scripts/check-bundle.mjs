import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { isMain } from './source-files.mjs';

const menuSource = 'libs/shared/ui/src/lib/wrappers/menu/menu.ts';
const catalogSource = 'libs/shared/catalog/src/';
const toolsSource = 'libs/features/tools/src/';

export function staticClosure(outputs, roots) {
  const files = new Set();
  function visit(file) {
    if (files.has(file)) return;
    const output = outputs[file];
    if (!output) throw new Error('Bundle metadata is missing a static output.');
    files.add(file);
    for (const dependency of output.imports ?? []) {
      if (dependency.external || dependency.kind === 'dynamic-import') continue;
      if (!/\.(?:js|css)$/.test(dependency.path)) continue;
      const path = Object.hasOwn(outputs, dependency.path)
        ? dependency.path
        : posix.normalize(posix.join(posix.dirname(file), dependency.path));
      visit(path);
    }
  }
  roots.forEach(visit);
  return [...files];
}

function inputsOf(outputs, files) {
  const inputs = {};
  for (const file of files) {
    for (const [source, { bytesInOutput }] of Object.entries(outputs[file].inputs)) {
      inputs[source] = (inputs[source] ?? 0) + bytesInOutput;
    }
  }
  return inputs;
}

export function analyzeBundle({ outputs }) {
  const main = Object.keys(outputs).filter(
    (file) => outputs[file].entryPoint === 'apps/dotln/src/main.ts',
  );
  if (main.length !== 1) throw new Error('Expected one application entry in bundle metadata.');
  const styles = Object.keys(outputs).filter(
    (file) => outputs[file].entryPoint === 'angular:styles/global:styles',
  );
  const initial = staticClosure(outputs, [...main, ...styles]);
  const inputs = inputsOf(outputs, initial);
  const packages = {};
  for (const [source, bytes] of Object.entries(inputs)) {
    const dependency = source.match(/(?:^|\/)node_modules\/((?:@[^/]+\/)?[^/]+)/);
    const group = dependency
      ? dependency[1]
      : source.startsWith('libs/') || source.startsWith('apps/')
        ? source.split('/').slice(0, 3).join('/')
        : 'styles and generated';
    packages[group] = (packages[group] ?? 0) + bytes;
  }
  const tools = Object.keys(outputs).filter(
    (file) => outputs[file].entryPoint === `${toolsSource}index.ts`,
  );
  const toolsInputs = inputsOf(outputs, staticClosure(outputs, tools));
  return {
    initialBytes: initial.reduce((total, file) => total + outputs[file].bytes, 0),
    initialFiles: initial,
    // Input attribution precedes final output optimization; it need not sum to output bytes.
    attributedInputBytes: packages,
    lazyCodeInInitial: Object.keys(inputs).filter(
      (source) =>
        inputs[source] > 0 &&
        (source === menuSource ||
          source.startsWith(catalogSource) ||
          source.startsWith(toolsSource)),
    ),
    menuAvailableWithTools: (toolsInputs[menuSource] ?? 0) > 0,
  };
}

export function checkBundle(stats) {
  const report = analyzeBundle(stats);
  if (report.lazyCodeInInitial.length)
    throw new Error('Route-only code entered the initial bundle.');
  if (!report.menuAvailableWithTools)
    throw new Error('The Tools route no longer loads its menu statically.');
  return report;
}

if (isMain(import.meta.url)) {
  const path = process.argv[2] ?? 'dist/apps/dotln/browser-stats.json';
  console.log(JSON.stringify(checkBundle(JSON.parse(readFileSync(path, 'utf8'))), null, 2));
}
