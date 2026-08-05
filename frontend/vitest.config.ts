import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["app/**/*.test.{ts,tsx}", "components/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Server Components and Server Actions can't be rendered/executed by
      // RTL+jsdom (no request scope for cookies()/redirect()); those paths
      // are exercised by the Playwright e2e suite instead. This threshold
      // covers Client Components only.
      include: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
      exclude: [
        "**/*.config.*",
        "app/**/page.tsx",
        "app/layout.tsx",
        "app/**/actions.ts",
        "app/**/*.test.*",
        "components/**/*.test.*",
        "env.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
