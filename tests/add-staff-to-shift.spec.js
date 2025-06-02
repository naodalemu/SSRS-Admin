import { test, expect } from '@playwright/test';

test.describe('Add Staff to Shift Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Log in (if authentication is required)
    await page.fill('#email', 'naodalemu11@gmail.com'); // Replace with valid credentials
    await page.fill('#password', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Navigate to the Add Staff to Shift page
    await page.goto('/staff/add-to-shift');
  });

  test('should add staff to a shift successfully', async ({ page }) => {
    // Select a staff member
    await page.selectOption('select[name="staff_id"]', '16'); // Replace '1' with a valid staff ID

    // Select a shift template
    await page.selectOption('select[name="shift_id"]', '8'); // Replace '2' with a valid shift ID

    // Set the start date
    await page.fill('input[name="date"]', '2025-06-01');

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify success message
    const successMessage = await page.locator('.bg-green-100');
    await expect(successMessage).toContainText('Successfully assigned shifts');
  });

  test('should show error for invalid input', async ({ page }) => {
    await page.selectOption('select[name="staff_id"]', '16');
    await page.selectOption('select[name="shift_id"]', '1');
    await page.fill('input[name="date"]', '2025-06-01');
    await page.click('button[type="submit"]');

    // Verify error message
    const errorMessage = await page.locator('.text-red-700');
    await expect(errorMessage).toContainText('Start time cannot be in the past.');
  });
});