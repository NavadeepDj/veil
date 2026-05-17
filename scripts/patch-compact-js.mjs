/**
 * @midnight-ntwrk/compact-js@2.5.0 points "default" export at missing dist/cjs/index.js.
 * Repoint it to the shipped ESM build so tsx and Node can load the package.
 */
import { readFile, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = join(root, 'node_modules/@midnight-ntwrk/compact-js/package.json');
const esmIndex = join(root, 'node_modules/@midnight-ntwrk/compact-js/dist/esm/index.js');

try {
  await access(esmIndex);
} catch {
  console.warn('[patch-compact-js] @midnight-ntwrk/compact-js not installed; skipping');
  process.exit(0);
}

const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));

if (pkg.exports?.['.']?.default === './dist/esm/index.js') {
  console.log('[patch-compact-js] already patched');
  process.exit(0);
}

if (pkg.exports?.['.']) {
  pkg.exports['.'].default = './dist/esm/index.js';
}

await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log('[patch-compact-js] set exports["."].default → dist/esm/index.js');
