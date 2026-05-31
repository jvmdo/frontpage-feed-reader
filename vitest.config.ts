import { loadEnvConfig } from "@next/env";
import react from "@vitejs/plugin-react"; // Required for JSX transformation
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// Load environment variables before setting up the config
loadEnvConfig(process.cwd());

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    testTimeout: 10000,
    // 1. Specify the DOM environment
    environment: "jsdom",
    // 2. Enable global APIs like 'describe' and 'it' (optional but common)
    globals: true,
    // 3. Path to your setup file
    setupFiles: "src/tests/setup.tsx",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules", "e2e"],
    coverage: {
      provider: "v8", // Use v8 for coverage reports
      reporter: [
        "text", // Text output in your terminal
        "json", // JSON file for tooling
        "html", // An interactive HTML report to open in your browser.
      ],
    },
  },
  server: {
    port: 3000,
    watch: {
      ignored: ["**/*.{test,spec}.{js,jsx,ts,tsx}", "**/*.md"],
    },
  },
});
