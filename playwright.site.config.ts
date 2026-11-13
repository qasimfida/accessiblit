import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/site',
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: 'http://127.0.0.1:4175/accessiblit/',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
    { name: 'iphone', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
    { name: 'pixel', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npm run build:site && npm run preview:site -- --port 4175',
    url: 'http://127.0.0.1:4175/accessiblit/',
    timeout: 120000,
    reuseExistingServer: false,
  },
});
