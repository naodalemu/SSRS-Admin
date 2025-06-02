import { test, expect } from '@playwright/test';

test.describe('Attendance Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Log in (if authentication is required)
    await page.fill('#email', 'naodalemu11@gmail.com');
    await page.fill('#password', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Navigate to the Attendance page
    await page.goto('/staff/attendance');
  });

  test('should display the Attendance page', async ({ page }) => {
    // Verify the page title
    const title = await page.locator('h1:has-text("Attendance")');
    await expect(title).toBeVisible();

    await page.click('button:has-text("Start Scanning")');
    // Verify the scanner section is displayed
    const scanner = await page.locator('#reader');
    await expect(scanner).toBeVisible();
  });

  test('should start and stop the scanner', async ({ page }) => {
    // Start the scanner
    await page.click('button:has-text("Start Scanning")');
    const scannerRunning = await page.locator('#reader');
    await expect(scannerRunning).toBeVisible();

    // Stop the scanner
    await page.click('button:has-text("Stop Scanning")');
    const scannerStopped = await page.locator('#reader');
    await expect(scannerStopped).toBeVisible();
  });

  test('should change mode to clock in and clock out', async ({ page }) => {
    // Change mode to "Clock In"
    await page.click('button:has-text("Clock In")');
    const clockInButton = await page.locator('button:has-text("Clock In")');
    await expect(clockInButton).toHaveClass(/bg-green-500/);

    // Change mode to "Clock Out"
    await page.click('button:has-text("Clock Out")');
    const clockOutButton = await page.locator('button:has-text("Clock Out")');
    await expect(clockOutButton).toHaveClass(/bg-green-500/);
  });

  test('should update tolerance time', async ({ page }) => {
    // Update tolerance time
    await page.fill('input[type="number"]', '10');
    const toleranceInput = await page.locator('input[type="number"]');
    await expect(toleranceInput).toHaveValue('10');
  });

  test('should handle attendance scan', async ({ page }) => {
    // Simulate scanning a QR code
    await page.click('button:has-text("Start Scanning")');
    const scannerRunning = await page.locator('#reader');
    await expect(scannerRunning).toBeVisible();

    // Simulate a successful scan
    const successMessage = await page.locator('.text-green-700');
    await expect(successMessage).toContainText('Attendance recorded successfully');
  });
});