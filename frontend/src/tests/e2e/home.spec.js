/**
 * E2E: public pages, route protection and sign-in for every demo role.
 */
import { test, expect } from '@playwright/test';
import { DEMO, login, logout } from './helpers';

test.describe('Public pages (signed out)', () => {
  test('home page shows the brand, track box and login/register actions', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/JanSewa/i);
    await expect(page.locator('.brand-name')).toContainText('Jan');
    await expect(page.locator('#track')).toBeVisible();
    await expect(page.locator('.header-actions').getByRole('link', { name: /login/i })).toBeVisible();
  });

  test('filing a complaint while signed out prompts for login', async ({ page }) => {
    await page.goto('/');
    await page.locator('.service-card').first().getByRole('button', { name: /file a complaint/i }).click();
    await expect(page.getByRole('dialog')).toContainText(/login required/i);
  });

  test('transparency portal loads live statistics without signing in', async ({ page }) => {
    await page.goto('/transparency');
    await expect(page).toHaveURL(/transparency/);
    await expect(page.getByTestId('stat-total')).not.toHaveText('-');
    expect(Number(await page.getByTestId('stat-total').textContent())).toBeGreaterThan(0);
    await expect(page.getByText(/Recently Resolved & Verified Works/)).toBeVisible();
  });

  for (const path of ['/citizen/dashboard', '/officer/dashboard', '/admin/dashboard', '/map']) {
    test(`protected route ${path} redirects to login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test('wrong password shows a friendly error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill(DEMO.citizen);
    await page.locator('#password').fill('not-the-password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Incorrect email or password.');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Signing in as each role', () => {
  const cases = [
    { role: 'Citizen', email: DEMO.citizen, path: /\/citizen\/dashboard/, heading: /Welcome, Aarav/ },
    { role: 'Officer', email: DEMO.officer, path: /\/officer\/dashboard/, heading: /Officer Portal: Rahul Sharma/ },
    { role: 'Dept Head', email: DEMO.head, path: /\/department\/dashboard/, heading: /Department Command: Sanitation Department/ },
    { role: 'Admin', email: DEMO.admin, path: /\/admin\/dashboard/, heading: /System Administration/ },
  ];

  for (const { role, email, path, heading } of cases) {
    test(`${role} lands on their dashboard and can log out`, async ({ page }) => {
      await login(page, email, undefined, path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
      await logout(page);
    });
  }

  test('demo account button signs in with one click', async ({ page }) => {
    await page.goto('/login');
    await page.locator('.demo-instant-box').getByRole('button', { name: 'Officer' }).click();
    await expect(page).toHaveURL(/\/officer\/dashboard/);
  });

  test('a citizen opening an admin page is sent back to their own dashboard', async ({ page }) => {
    await login(page, DEMO.citizen, undefined, /\/citizen\/dashboard/);
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/citizen\/dashboard/);
  });

  test('an officer only sees cases assigned to them', async ({ page }) => {
    await login(page, DEMO.officer, undefined, /\/officer\/dashboard/);
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
    await expect(page.getByText('GRV-2026-00125')).toBeVisible();
    await expect(page.getByText('GRV-2026-00109')).toHaveCount(0); // unassigned roads case
  });
});
