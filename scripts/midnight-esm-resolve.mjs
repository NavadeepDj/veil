import { pathToFileURL } from 'node:url';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
const compactJsEsm = pathToFileURL(
  resolvePath(root, 'node_modules/@midnight-ntwrk/compact-js/dist/esm/index.js'),
).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@midnight-ntwrk/compact-js') {
    return { url: compactJsEsm, shortCircuit: true, format: 'module' };
  }
  return nextResolve(specifier, context);
}
