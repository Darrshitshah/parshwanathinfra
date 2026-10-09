import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// Unit tests live next to the code (src/**/*.test.ts[x]) plus repo-wide checks in tests/unit.
// Default environment is node; component tests opt in with a `// @vitest-environment jsdom` first line.
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}", "tools/**/*.test.{ts,mts}"],
    exclude: ["node_modules/**", "tests/e2e/**", "_source/**", ".next/**"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/content/**", "src/lib/**", "src/app/api/**"],
      exclude: ["**/*.test.*", "**/*.d.ts"],
      reporter: ["text-summary", "text"],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
});
