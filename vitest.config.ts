import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts", "**/*.spec.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.next/**", "**/coverage/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.next/**",
        "**/coverage/**",
        "**/*.config.{js,ts}",
        "**/*.test.{js,ts}",
        "**/*.spec.{js,ts}",
        "**/test/**",
        "**/__tests__/**",
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      "@khipu/api": path.resolve(__dirname, "./apps/api/src"),
      "@khipu/web": path.resolve(__dirname, "./apps/web/src"),
      "@khipu/blockchain": path.resolve(__dirname, "./packages/blockchain/src"),
      "@khipu/database": path.resolve(__dirname, "./packages/database/src"),
      "@khipu/shared": path.resolve(__dirname, "./packages/shared/src"),
      "@khipu/ui": path.resolve(__dirname, "./packages/ui/src"),
      "@khipu/web3": path.resolve(__dirname, "./packages/web3/src"),
    },
  },
});
