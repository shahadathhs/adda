import { defineConfig } from "@playwright/test";

// The stack (web :5173, backend :7001, mediamtx :1935) must already be running:
// `make dev` locally, `docker compose up` in CI. Set E2E_CHROME=1 to drive the installed
// Google Chrome instead of Playwright's bundled Chromium.
export default defineConfig({
  testDir: ".",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: process.env.E2E_WEB ?? "http://localhost:5173",
    channel: process.env.E2E_CHROME ? "chrome" : undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
