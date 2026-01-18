import { defineConfig, mergeConfig } from "vitest/config";
import rootConfig from "../../vitest.config";

export default mergeConfig(
  rootConfig,
  defineConfig({
    test: {
      name: "@khipu/api",
      environment: "node",
      include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html", "lcov"],
        reportsDirectory: "./coverage",
        include: ["src/**/*.ts"],
        exclude: ["src/**/*.test.ts", "src/**/*.spec.ts", "src/__tests__/**", "src/index.ts"],
        all: true,
        // TODO: Incrementar gradualmente - ver docs/TESTING_ROADMAP.md
        lines: 35,
        functions: 30,
        branches: 30,
        statements: 35,
      },
      setupFiles: ["./src/__tests__/setup.ts"],
    },
  })
);
