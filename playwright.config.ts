import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3001',
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev:frontend',
    url: 'http://localhost:3001/auth/login',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
