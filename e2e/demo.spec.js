import { test, expect } from '@playwright/test';

test.describe('JanSewa End-to-End Civic Governance Full Workflow', () => {
  let complaintId = '';

  test.beforeAll(async ({ request }) => {
    // Ensure backend is reachable
    const res = await request.get('http://localhost:5000/api/health');
    expect(res.ok()).toBeTruthy();
  });

  // Helper for consistent logout across roles
  async function performLogout(page) {
    const logoutBtn = page.locator('button:has-text("Logout")');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page.locator('a:has-text("Login")').first()).toBeVisible({ timeout: 10000 });
    }
  }

  test('walks through complete lifecycle across Citizen, Dept Head, Officer, Admin & Public Tracking', async ({ page }) => {
    test.setTimeout(120000);

    // =========================================================================
    // STEP 1: Citizen logs in and files a complaint with photo evidence
    // =========================================================================
    await page.goto('/#/login');
    await page.fill('#email', 'palak.rathod@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]:has-text("Log in")');
    await page.waitForURL('**/#/citizen/dashboard');

    // Click "File a complaint"
    await page.click('a:has-text("File a complaint")');
    await page.waitForURL('**/#/citizen/submit');

    // Fill the grievance form
    await page.selectOption('#category', 'cat-water');
    await page.fill('#subject', 'Main pipe burst flooding residential lane');
    await page.fill('#description', 'Potable drinking water line ruptured near the apartment gate. Water continuously gushing into roadway.');
    await page.fill('#location', 'Sector 4, Near Municipal Tank, Bhayandar West');

    // Upload photo evidence (magic-byte valid JPEG)
    await page.locator('input[type="file"]').first().setInputFiles('e2e/fixtures/test-evidence.jpg');

    // Submit complaint
    await page.click('button[type="submit"]:has-text("Submit grievance")');

    // Wait for submission confirmation
    await page.waitForSelector('.big-id', { timeout: 15000 });
    complaintId = (await page.locator('.big-id').textContent()).trim();
    console.log(`[E2E] New Complaint Successfully Filed: ${complaintId}`);
    expect(complaintId).toMatch(/^GRV-2026-\d+$/);

    // Verify "Complain filed" toast appears on top right
    const toast = page.locator('#complain-filed-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Complain filed');

    // Citizen logs out
    await performLogout(page);

    // =========================================================================
    // STEP 2: Department Head logs in and assigns a field officer
    // =========================================================================
    await page.goto('/#/login');
    await page.fill('#email', 'water@jansewa.gov.in');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]:has-text("Log in")');
    await page.waitForURL('**/#/department/dashboard');

    // Locate the newly filed unassigned grievance row
    const deptRow = page.locator('tr', { hasText: complaintId }).first();
    await expect(deptRow).toBeVisible();

    // Click "Assign Officer"
    await deptRow.locator('button:has-text("Assign Officer")').first().click();
    await page.waitForSelector('.modal-dialog');

    // Select the first available officer (Suresh More)
    await page.selectOption('.modal-dialog select', { index: 0 });
    await page.fill('.modal-dialog textarea', 'Urgent pipeline repair required immediately.');
    await page.click('.modal-dialog button[type="submit"]:has-text("Confirm Assignment")');
    await page.waitForSelector('.modal-backdrop', { state: 'detached', timeout: 10000 });

    // Verify notifications bell has count / can be opened
    const notifBtn = page.locator('#notif-bell-btn');
    await expect(notifBtn).toBeVisible();
    await notifBtn.click();
    await expect(page.locator('.notif-dropdown-menu')).toBeVisible();
    // Close notification dropdown
    await notifBtn.click();

    // Department Head logs out
    await performLogout(page);

    // =========================================================================
    // STEP 3: Officer logs in, accepts case (Start Work), and resolves with photo
    // =========================================================================
    await page.goto('/#/login');
    await page.fill('#email', 'suresh.more@water.gov.in');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]:has-text("Log in")');
    await page.waitForURL('**/#/officer/dashboard');

    const officerRow = page.locator('tr', { hasText: complaintId }).first();
    await expect(officerRow).toBeVisible();

    // Click "Start Work"
    await officerRow.locator('button:has-text("Start Work")').click();
    await expect(officerRow.locator('button:has-text("Submit Proof")')).toBeVisible({ timeout: 10000 });

    // Click "Submit Proof" to open ResolutionModal
    await officerRow.locator('button:has-text("Submit Proof")').click();
    await page.waitForSelector('#res-description');

    await page.fill('#res-description', 'Repaired fractured pipeline section with heavy duty stainless clamp and tested pressure.');
    await page.locator('.modal-dialog input[type="file"]').first().setInputFiles('e2e/fixtures/test-proof.jpg');
    await page.click('.modal-dialog button[type="submit"]:has-text("Send for Citizen Verification")');
    await page.waitForSelector('.modal-backdrop', { state: 'detached', timeout: 10000 });

    // Verify row now shows Awaiting Verification
    await expect(officerRow.locator('text=Awaiting Verification')).toBeVisible();

    // Officer logs out
    await performLogout(page);

    // =========================================================================
    // STEP 4: Citizen inspects resolution, rejects and reopens with reason
    // =========================================================================
    await page.goto('/#/login');
    await page.fill('#email', 'palak.rathod@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]:has-text("Log in")');
    await page.waitForURL('**/#/citizen/dashboard');

    // Verification prompt button should be visible
    const verifyBtn = page.locator('button:has-text("Verify Resolution")').first();
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();
    await page.waitForSelector('.modal-dialog');

    // Switch to Reopen mode
    await page.click('button:has-text("Not Resolved (Reopen)")');
    await page.fill('.modal-dialog textarea', 'Water is still trickling out slowly from under the asphalt bedding.');
    await page.click('button[type="submit"]:has-text("Reopen Grievance & Escalate")');
    await page.waitForSelector('.modal-backdrop', { state: 'detached', timeout: 10000 });

    // Citizen logs out
    await performLogout(page);

    // =========================================================================
    // STEP 5: Officer redoes work and resubmits resolution proof
    // =========================================================================
    await page.goto('/#/login');
    await page.fill('#email', 'suresh.more@water.gov.in');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]:has-text("Log in")');
    await page.waitForURL('**/#/officer/dashboard');

    const redoRow = page.locator('tr', { hasText: complaintId }).first();
    await expect(redoRow).toBeVisible();

    // Click "Start Work" on reopened complaint
    await redoRow.locator('button:has-text("Start Work")').click();
    await expect(redoRow.locator('button:has-text("Submit Proof")')).toBeVisible({ timeout: 10000 });

    // Resolve again with new proof
    await redoRow.locator('button:has-text("Submit Proof")').click();
    await page.waitForSelector('#res-description');
    await page.fill('#res-description', 'Excavated entire joint, replaced 2m pipe segment with new ductile iron pipe and encased in concrete.');
    await page.locator('.modal-dialog input[type="file"]').first().setInputFiles('e2e/fixtures/test-proof.jpg');
    await page.click('.modal-dialog button[type="submit"]:has-text("Send for Citizen Verification")');
    await page.waitForSelector('.modal-backdrop', { state: 'detached', timeout: 10000 });

    // Officer logs out
    await performLogout(page);

    // =========================================================================
    // STEP 6: Citizen confirms satisfaction, rates 5 stars, and closes complaint
    // =========================================================================
    await page.goto('/#/login');
    await page.fill('#email', 'palak.rathod@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]:has-text("Log in")');
    await page.waitForURL('**/#/citizen/dashboard');

    const finalVerifyBtn = page.locator('button:has-text("Verify Resolution")').first();
    await expect(finalVerifyBtn).toBeVisible();
    await finalVerifyBtn.click();
    await page.waitForSelector('.modal-dialog');

    // Ensure "Issue Resolved" is active (default)
    await page.fill('.modal-dialog textarea', 'Completely sealed now. Excellent second repair job, zero water leakage!');
    await page.click('button[type="submit"]:has-text("Verify & Close Grievance")');
    await page.waitForSelector('.modal-backdrop', { state: 'detached', timeout: 10000 });

    // Citizen logs out
    await performLogout(page);

    // =========================================================================
    // STEP 7: Public anonymous tracking at /track/<id> in logged-out window
    // =========================================================================
    await page.goto(`/#/track/${complaintId}`);
    await expect(page.locator(`text=${complaintId}`).first()).toBeVisible();
    await expect(page.locator('.badge-closed').first()).toBeVisible();
    await expect(page.locator('text=Citizen Verified & Closed').first()).toBeVisible();

    // =========================================================================
    // STEP 8: Admin logs in, verifies GIS Map and Audit Logs
    // =========================================================================
    await page.goto('/#/login');
    await page.fill('#email', 'admin@jansewa.gov.in');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]:has-text("Log in")');
    await page.waitForURL('**/#/admin/dashboard');

    // Verify GIS Complaint Map page loads with Leaflet markers
    await page.goto('/#/admin/map');
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible();

    // Verify Audit Logs show the recorded lifecycle actions
    await page.goto('/#/admin/audit-logs');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator(`text=${complaintId}`).first()).toBeVisible();
    await expect(page.locator('text=CITIZEN_VERIFIED_CLOSED').first()).toBeVisible();

    console.log('[E2E] End-to-End Civic Governance Workflow Test Completed Successfully!');
  });
});
