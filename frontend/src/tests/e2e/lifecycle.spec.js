/**
 * E2E: the complete grievance lifecycle through the UI, across four roles:
 * citizen files → department head assigns → officer resolves → citizen
 * reopens → officer resolves again → citizen approves → public portal.
 */
import { test, expect } from '@playwright/test';
import { DEMO, PNG, createTestCitizen, deleteTestUser, getUserId, login, removeUploadsNewerThan } from './helpers';

test.describe.configure({ mode: 'serial' });

let citizen;
let rahulId;
let grievancePath;
let complaintId;
const startedAt = new Date();
const subject = `E2E overflowing bin ${Date.now()}`;

test.beforeAll(async () => {
  citizen = await createTestCitizen('Ravi Kumar');
  rahulId = await getUserId(DEMO.officer);
});

test.afterAll(async () => {
  await deleteTestUser(citizen?.id);
  if (rahulId) await removeUploadsNewerThan(rahulId, startedAt);
});

test('citizen files a grievance with a photo', async ({ page }) => {
  await login(page, citizen.email, citizen.password, /\/citizen\/dashboard/);
  await page.getByRole('link', { name: 'File a complaint' }).first().click();
  await expect(page).toHaveURL(/\/citizen\/submit/);

  await page.locator('#category').selectOption('Sanitation');
  await page.locator('#subject').fill(subject);
  await page.locator('#description').fill('The community bin has been overflowing for four days and smells terrible.');
  await page.locator('#location').fill('Lane 3, Sector 12, Testpur East');

  // Submitting without a photo is blocked.
  await page.getByRole('button', { name: /submit grievance with photo/i }).click();
  await expect(page.getByRole('alert')).toContainText(/upload or select a photo/i);

  await page.locator('#file-upload').setInputFiles(PNG);
  await expect(page.getByAltText('Problem to be fixed')).toHaveAttribute('src', /grievance-photos/);

  await page.getByRole('button', { name: /submit grievance with photo/i }).click();
  await expect(page.getByText('Grievance Registered Successfully')).toBeVisible();
  complaintId = (await page.locator('.big-id').textContent()).trim();
  expect(complaintId).toMatch(/^GRV-\d{4}-\d{5}$/);

  await page.getByRole('link', { name: 'View Grievance' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(complaintId);
  grievancePath = new URL(page.url()).pathname; // /citizen/grievance/<uuid>
  await expect(page.locator('.timeline')).toContainText('Submitted');
});

test('department head assigns the case to a field officer', async ({ page }) => {
  await login(page, DEMO.head, undefined, /\/department\/dashboard/);
  await expect(page.getByText(complaintId)).toBeVisible();
  await page.getByRole('link', { name: complaintId }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(complaintId);

  await expect(page.locator('#dept-select')).toBeDisabled(); // heads stay within their department
  await page.locator('#officer-select').selectOption(rahulId);
  await page.locator('#priority-select').selectOption('High');
  await page.locator('#admin-remark').fill('Send the loader vehicle today.');
  await page.getByRole('button', { name: /assign officer & start field work/i }).click();

  await expect(page.getByRole('status')).toContainText('assigned to Officer Rahul Sharma');
  await expect(page.locator('.timeline')).toContainText('In Progress');
});

test('officer sees the notification and resolves with proof', async ({ page }) => {
  await login(page, DEMO.officer, undefined, /\/officer\/dashboard/);

  await page.getByRole('button', { name: /notifications/i }).click();
  await expect(page.locator('.notif-dropdown')).toContainText(complaintId);
  await page.keyboard.press('Escape');

  await page.goto(grievancePath.replace('/citizen/', '/officer/'));
  await expect(page.getByRole('heading', { level: 1 })).toContainText(complaintId);
  await page.locator('#officer-file-upload').setInputFiles(PNG);
  await expect(page.getByAltText('Solved problem proof')).toBeVisible();
  await page.locator('#res-remark').fill('Bin emptied, area disinfected.');
  await page.getByRole('button', { name: /upload proof & mark problem solved/i }).click();

  await expect(page.getByRole('status')).toContainText('marked as Resolved');
  await expect(page.getByText('Problem Solved & Proof Verified')).toBeVisible();
});

test('citizen rejects the work and reopens the case', async ({ page }) => {
  await login(page, citizen.email, citizen.password, /\/citizen\/dashboard/);
  await expect(page.getByText(/Action Required: Field Officer Completed Work/)).toBeVisible();

  await page.goto(grievancePath);
  await page.getByRole('button', { name: /issue not resolved/i }).click();
  await page.locator('#reopen-reason').fill('Garbage is still piled behind the bin.');
  await page.locator('#reopen-file-upload').setInputFiles(PNG);
  await expect(page.getByAltText('Rejection evidence')).toBeVisible();
  await page.getByRole('button', { name: /submit rejection & reopen complaint/i }).click();

  await expect(page.getByRole('status')).toContainText('reopened');
  await expect(page.getByText(/Complaint Reopened/)).toBeVisible();
});

test('officer resolves the reopened case again', async ({ page }) => {
  await login(page, DEMO.officer, undefined, /\/officer\/dashboard/);
  await page.goto(grievancePath.replace('/citizen/', '/officer/'));
  await expect(page.getByText(/Work Rejected by Citizen/)).toBeVisible();
  await page.locator('#officer-file-upload').setInputFiles(PNG);
  await page.locator('#res-remark').fill('Bulk waste removed and footpath washed.');
  await page.getByRole('button', { name: /upload proof & mark problem solved/i }).click();
  await expect(page.getByRole('status')).toContainText('marked as Resolved');
});

test('citizen approves with a rating and the case closes', async ({ page }) => {
  await login(page, citizen.email, citizen.password, /\/citizen\/dashboard/);
  await page.goto(grievancePath);
  await page.getByRole('button', { name: /issue resolved \(approve & close\)/i }).click();
  await page.getByRole('button', { name: '4 stars' }).click();
  await page.locator('#feedback-comment').fill('Properly cleaned the second time.');
  await page.getByRole('button', { name: /confirm resolution & close grievance/i }).click();

  await expect(page.getByText('Grievance Verified & Closed')).toBeVisible();
  const timeline = page.locator('.timeline');
  for (const status of ['Submitted', 'In Progress', 'Resolved', 'Reopened', 'Closed']) {
    await expect(timeline).toContainText(status);
  }

  await page.goto('/citizen/my-grievances?tab=history');
  await expect(page.getByRole('row', { name: new RegExp(complaintId) })).toContainText('★ 4/5');
});

test('the closed case appears on the public transparency portal', async ({ page }) => {
  await page.goto('/transparency');
  await expect(page.getByText(subject)).toBeVisible();
});
