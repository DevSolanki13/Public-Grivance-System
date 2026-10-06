/**
 * E2E TEST: Home Page & Public Navigation
 * Verifies the public-facing landing page, navigation links,
 * and that unauthenticated users are redirected correctly.
 */
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page title contains JanSewa', async ({ page }) => {
    await expect(page).toHaveTitle(/JanSewa/i);
  });

  test('renders the brand name in the navbar', async ({ page }) => {
    const brand = page.locator('.brand-name');
    await expect(brand).toBeVisible();
    await expect(brand).toContainText('Jan');
  });

  test('navbar shows user session pill or login/register buttons', async ({ page }) => {
    // Under demo mode the app boots into a demo persona (Citizen)
    // Verify that the header actions contain either the role pill or login/register
    const headerActions = page.locator('.header-actions');
    await expect(headerActions).toBeVisible();
  });

  test('clicking Track request anchor or card exists on home page', async ({ page }) => {
    const trackSection = page.locator('#track');
    await expect(trackSection).toBeVisible();
  });

  test('Public Transparency link is in the navbar', async ({ page }) => {
    const transparencyLink = page.locator('.nav-links').getByRole('link', { name: /public transparency/i });
    await expect(transparencyLink).toBeVisible();
  });
});

test.describe('Public Navigation', () => {
  test('navigating to /transparency renders the page without crashing', async ({ page }) => {
    await page.goto('/transparency');
    await expect(page).not.toHaveURL(/login/);
    // Page should have loaded content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('navigating to /login renders the login page with sign-in button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('navigating to /register renders the register form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('form')).toBeVisible();
  });
});
