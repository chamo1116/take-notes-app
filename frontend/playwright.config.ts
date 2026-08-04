import { defineConfig } from "@playwright/test";

// Chromium-only viewport emulation (no WebKit/Firefox binaries baked into the
// image) covering the skill's required 375/768/1440 breakpoints.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    browserName: "chromium",
  },
  projects: [
    {
      name: "mobile",
      use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
    },
    {
      name: "tablet",
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: "desktop",
      use: { viewport: { width: 1440, height: 900 } },
    },
  ],
});
