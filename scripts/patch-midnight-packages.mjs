/**
 * Midnight npm packages often declare "default" exports to dist/cjs/* that are not shipped.
 * Repoint each default export to the matching dist/esm file when CJS is missing.
 */
import { access, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir } from 'node:fs/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scopeDir = join(root, 'node_modules/@midnight-ntwrk');

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function patchExportTarget(target, pkgDir) {
  if (typeof target !== 'string' || !target.includes('/dist/cjs/')) {
    return target;
  }
  return target.replace('/dist/cjs/', '/dist/esm/');
}

async function patchExports(exports, pkgDir) {
  if (!exports || typeof exports !== 'object') {
    return 0;
  }

  let changes = 0;

  for (const [key, value] of Object.entries(exports)) {
    if (typeof value === 'string') {
      const next = patchExportTarget(value, pkgDir);
      if (next !== value) {
        const cjsPath = join(pkgDir, value.replace(/^\.\//, ''));
        const esmPath = join(pkgDir, next.replace(/^\.\//, ''));
        if (!(await fileExists(cjsPath)) && (await fileExists(esmPath))) {
          exports[key] = next;
          changes++;
        }
      }
      continue;
    }

    if (value && typeof value === 'object') {
      if (value.default) {
        const current = value.default;
        const next = patchExportTarget(current, pkgDir);
        if (next !== current) {
          const cjsPath = join(pkgDir, current.replace(/^\.\//, ''));
          const esmPath = join(pkgDir, next.replace(/^\.\//, ''));
          if (!(await fileExists(cjsPath)) && (await fileExists(esmPath))) {
            value.default = next;
            changes++;
          }
        }
      }
      for (const subKey of ['import', 'require', 'node', 'default']) {
        if (typeof value[subKey] === 'string') {
          const current = value[subKey];
          const next = patchExportTarget(current, pkgDir);
          if (next !== current && subKey === 'default') {
            const cjsPath = join(pkgDir, current.replace(/^\.\//, ''));
            const esmPath = join(pkgDir, next.replace(/^\.\//, ''));
            if (!(await fileExists(cjsPath)) && (await fileExists(esmPath))) {
              value[subKey] = next;
              changes++;
            }
          }
        }
      }
    }
  }

  return changes;
}

async function main() {
  let total = 0;

  let packages;
  try {
    packages = await readdir(scopeDir);
  } catch {
    console.warn('[patch-midnight-packages] @midnight-ntwrk not installed; skipping');
    return;
  }

  for (const name of packages) {
    const pkgDir = join(scopeDir, name);
    const pkgPath = join(pkgDir, 'package.json');

    if (!(await fileExists(pkgPath))) {
      continue;
    }

    const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
    const changes = await patchExports(pkg.exports, pkgDir);

    if (changes > 0) {
      await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
      console.log(`[patch-midnight-packages] ${name}: ${changes} export(s) → esm`);
      total += changes;
    }
  }

  if (total === 0) {
    console.log('[patch-midnight-packages] nothing to patch');
  }
}

main().catch((error) => {
  console.error('[patch-midnight-packages] failed:', error);
  process.exit(1);
});
