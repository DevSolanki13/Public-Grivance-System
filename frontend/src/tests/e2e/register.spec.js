/**
 * E2E: citizen self-registration.
 */
import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { deleteUserByEmail, logout, login } from './helpers';

const email = `e2e-register-${randomUUID()}@test.jansewa.in`;
const password = 'Register-Me-123';

test.afterAll(async () => {
  await deleteUserByEmail(email);
});

test('a new citizen registers, lands on their dashboard, and can sign back in', async ({ page }) => {
  await page.goto('/register');
  await page.locator('#name').fill('Meena Gupta');
  await page.locator('#phone').fill('9123456789');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/citizen\/dashboard/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome, Meena');
  await expect(page.getByText('You have no pending active requests.')).toBeVisible();

  await logout(page);
  await login(page, email, password, /\/citizen\/dashboard/);
});

test('registering an existing email shows an error', async ({ page }) => {
  await page.goto('/register');
  await page.locator('#name').fill('Duplicate');
  await page.locator('#phone').fill('9123456789');
  await page.locator('#email').fill('aarav.citizen@demo.jansewa.in');
  await page.locator('#password').fill('Whatever-123');
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page.getByRole('alert')).toContainText(/already registered/i);
});
