import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.tsx"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "**/*.d.ts",
        "**/types.ts",
        "**/types/**",
        "**/*.config.*",
        "**/generated/**",
      ],
      // TODO: Habilitar thresholds cuando cobertura aumente
      // Ver docs/TESTING_ROADMAP.md para el plan de incremento
      // thresholds: {
      //   lines: 85,
      //   functions: 85,
      //   branches: 80,
      //   statements: 85,
      // },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
