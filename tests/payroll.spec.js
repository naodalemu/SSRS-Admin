import { test, expect } from '@playwright/test';

test.describe('Payroll System Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the payroll page
        await page.goto('/login');
        // Log in (if authentication is required)
        await page.fill('#email', 'naodalemu11@gmail.com'); // Replace with valid credentials
        await page.fill('#password', '123456');
        await page.click('button[type="submit"]');
        await page.waitForURL('/');
        await page.goto('/staff/payroll');
    });

    test('should display payroll management page', async ({ page }) => {
        // Check if the title is displayed
        const title = await page.locator('h1:has-text("Payroll Management")');
        await expect(title).toBeVisible();
    });

    test('should allow date range selection', async ({ page }) => {
        // Select start and end dates
        await page.fill('input[type="date"]', '2025-05-01'); // Start Date
        await page.fill('input[type="date"] >> nth=1', '2025-05-30'); // End Date

        // Verify the inputs
        const startDate = await page.locator('input[type="date"]').first().inputValue();
        const endDate = await page.locator('input[type="date"] >> nth=1').first().inputValue();
        expect(startDate).toBe('2025-05-01');
        expect(endDate).toBe('2025-05-30');
    });

    test('should calculate payroll', async ({ page }) => {
        // Click the "Calculate Payroll" button
        await page.click('button:has-text("Calculate Payroll")');

        // Wait for the calculation to complete
        await page.waitForSelector('.text-3xl:has-text("Calculating payroll...")', { state: 'hidden' });

        // Verify payroll data is displayed
        const payrollTable = await page.locator('table');
        await expect(payrollTable).toBeVisible();
    });

    test('should export payroll data to CSV', async ({ page }) => {
        await page.click('button:has-text("Calculate Payroll")');
        // Click the "Export CSV" button
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('button:has-text("Export CSV")'),
        ]);
    });

    test('should export payroll data to PDF', async ({ page }) => {
        await page.click('button:has-text("Calculate Payroll")');
        // Click the "Export PDF" button
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('button:has-text("Export PDF")'),
        ]);
    });
});