import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests unitarios de la lógica en src/. Los de e2e/ son de Playwright (`npm run test:e2e`).
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"] },
});
