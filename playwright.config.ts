import { defineConfig, devices } from "@playwright/test";

const useProductionServer = process.env.PLAYWRIGHT_USE_PRODUCTION === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  workers: process.env.RUN_LOCAL_AUTH_E2E === "1" ? 1 : undefined,
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "desktop-firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "desktop-webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 15"] } },
  ],
  webServer: {
    command: useProductionServer
      ? "node_modules/.bin/next start"
      : "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: useProductionServer ? false : !process.env.CI,
  },
});
