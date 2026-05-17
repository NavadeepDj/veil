import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src"),
    },
  },
  test: {
    environment: "node",
    testTimeout: 300_000,   // 5 min — ZK proof generation is slow
    hookTimeout: 300_000,
    sequence: { concurrent: false },
  },
});
