import { test, expect } from '@playwright/test';

test.describe('Shift Template Management Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the Shift Template Management page
        await page.goto('/login');
        // Log in (if authentication is required)
        await page.fill('#email', 'naodalemu11@gmail.com'); // Replace with valid credentials
        await page.fill('#password', '123456');
        await page.click('button[type="submit"]');
        await page.waitForURL('/');
        await page.goto('/staff/create-shift');
    });

    test('should create a new shift template', async ({ page }) => {
        // Open the "Create Shift" form
        await page.click('button:has-text("Add Shift Template")');

        // Fill out the form fields
        await page.fill('input[name="name"]', 'Morning Shift');
        await page.fill('input[name="start_time"]', '09:00');
        await page.fill('input[name="end_time"]', '14:00');
        await page.check('input[name="is_overtime"]'); // Check the overtime checkbox
        await page.selectOption('select[name="overtime_type"]', 'normal'); // Select overtime type

        // Submit the form
        await page.click('button:has-text("Create Template")');

        // Verify the new shift template appears in the table
        const newShiftRow = await page.locator('table tbody tr').last();
        await expect(newShiftRow).toContainText('Morning Shift');
        await expect(newShiftRow).toContainText('09:00');
        await expect(newShiftRow).toContainText('14:00');
        await expect(newShiftRow).toContainText('normal');
    });
});