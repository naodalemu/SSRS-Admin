import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  use: {
    headless: true, // Run tests in headless mode
    baseURL: 'http://localhost:5174', // Replace with your app's base URL
    viewport: { width: 1280, height: 720 },
  },
  reporter: [['html', { open: 'never' }]],
});