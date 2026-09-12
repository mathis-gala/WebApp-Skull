import swc from "unplugin-swc"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    environment: "node",
    include: [
      process.env.AUTH_TEST_SUITE === "e2e"
        ? "test/**/*.e2e.ts"
        : "test/**/*.integration.ts",
    ],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
