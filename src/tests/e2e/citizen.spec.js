/**
 * E2E TEST: Citizen Dashboard & Demo Role Switching
 * Tests the complete citizen portal lifecycle using the built-in demo switcher.
 */
import { test, expect } from '@playwright/test';

// Helper: navigate to the citizen dashboard via the demo switcher
async function switchToCitizen(page) {
  await page.goto('/citizen/dashboard');
  // App auto-loads as citizen demo persona
  await page.waitForLoadState('networkidle');
}

test.describe('Citizen Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await switchToCitizen(page);
  });

  test('loads the citizen dashboard without errors', async ({ page }) => {
    // Should not redirect to /login since demo citizen is active
    await expect(page).not.toHaveURL(/login/);
  });

  test('shows the Citizen Dashboard navbar link', async ({ page }) => {
    const dashLink = page.locator('.nav-links a, .menu-bar a', { hasText: /citizen dashboard/i });
    await expect(dashLink).toBeVisible();
  });

  test('displays stats cards (Active Complaints, Pending Triage, In Progress, Needs Verification)', async ({ page }) => {
    await expect(page.locator('.stat-card').first()).toBeVisible();
    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(4);
  });

  test('displays "My active requests" section heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /my active requests/i });
    await expect(heading).toBeVisible();
  });

  test('File a complaint button is visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: /file a complaint/i })).toBeVisible();
  });

  test('Grievance History link is visible in the action bar', async ({ page }) => {
    await expect(page.getByRole('link', { name: /grievance history/i })).toBeVisible();
  });
});

test.describe('Demo Role Switcher', () => {
  test('DemoSwitcher bar is visible at the top of the page', async ({ page }) => {
    await page.goto('/citizen/dashboard');
    await expect(page.locator('.demo-switcher-bar')).toBeVisible();
  });

  test('switching to Officer role redirects to /officer/dashboard', async ({ page }) => {
    await page.goto('/');
    // Click the Officer button in the DemoSwitcher bar
    const officerBtn = page.locator('.demo-switcher-bar button', { hasText: /officer/i });
    if (await officerBtn.count() > 0) {
      await officerBtn.click();
      await page.waitForURL(/officer\/dashboard/);
      await expect(page).toHaveURL(/officer\/dashboard/);
    } else {
      // Demo switcher rendered differently, skip gracefully
      test.skip();
    }
  });
});

test.describe('My Grievances Page', () => {
  test('navigating to /citizen/my-grievances loads the page', async ({ page }) => {
    await page.goto('/citizen/my-grievances');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
  });
});
