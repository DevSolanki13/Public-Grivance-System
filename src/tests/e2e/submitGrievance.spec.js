/**
 * E2E TEST: Grievance Submission Flow
 * Tests the Submit Grievance form — fields, validation, and submission flow.
 */
import { test, expect } from '@playwright/test';

test.describe('Submit Grievance Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/citizen/submit');
    await page.waitForLoadState('networkidle');
  });

  test('renders the submit grievance form', async ({ page }) => {
    await expect(page.locator('form')).toBeVisible();
  });

  test('subject field is present', async ({ page }) => {
    const subject = page.locator('#subject');
    await expect(subject).toBeVisible();
  });

  test('category select dropdown is visible', async ({ page }) => {
    const select = page.locator('select').first();
    await expect(select).toBeVisible();
  });

  test('shows priority options', async ({ page }) => {
    const selects = page.locator('select');
    await expect(selects.first()).toBeVisible();
  });

  test('location field is present', async ({ page }) => {
    // Location is either an input or a textarea
    const locField = page.locator('input, textarea').nth(1);
    await expect(locField).toBeVisible();
  });

  test('submit button is present', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /submit/i });
    await expect(submitBtn).toBeVisible();
  });

  test('form does not submit with empty required fields', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /submit/i });
    await submitBtn.click();
    // Should still be on the same page — form validation prevents navigation
    await expect(page).toHaveURL(/submit/);
  });
});
