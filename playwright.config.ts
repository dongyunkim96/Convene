import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:3000',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : {
        command: `"${process.execPath}" --import tsx scripts/test-server.ts`,
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: false,
        timeout: 60000,
      },
  reporter: [['list'], ['html', { open: 'never' }]],
});
