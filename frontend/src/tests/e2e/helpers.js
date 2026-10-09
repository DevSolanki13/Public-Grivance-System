import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { expect } from '@playwright/test';

export const DEMO_PASSWORD = 'Demo@12345';
export const DEMO = {
  citizen: 'aarav.citizen@demo.jansewa.in',
  officer: 'rahul.officer@demo.jansewa.in',
  head: 'priya.head@demo.jansewa.in',
  admin: 'admin@demo.jansewa.in',
};

// 1×1 transparent PNG used for photo uploads.
export const PNG = {
  name: 'photo.png',
  mimeType: 'image/png',
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'),
};

let admin;
// Service-role client for test setup/teardown only (bypasses RLS).
function adminClient() {
  if (!admin) {
    const { VITE_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
    if (!url || !key) throw new Error('E2E tests need VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return admin;
}

export async function createTestCitizen(name = 'E2E Citizen') {
  const email = `e2e-${randomUUID()}@test.jansewa.in`;
  const password = `Pw-${randomUUID().slice(0, 12)}`;
  const { data, error } = await adminClient().auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { name, phone: '9000000001' },
  });
  if (error) throw error;
  return { id: data.user.id, email, password, name };
}

// Deleting the user cascades to their profile, grievances, events and notifications.
export async function deleteTestUser(id) {
  if (!id) return;
  const files = await adminClient().storage.from('grievance-photos').list(id);
  if (files.data?.length) {
    await adminClient().storage.from('grievance-photos').remove(files.data.map((f) => `${id}/${f.name}`));
  }
  await adminClient().auth.admin.deleteUser(id);
}

export async function deleteUserByEmail(email) {
  const { data } = await adminClient().from('profiles').select('id').eq('email', email).maybeSingle();
  await deleteTestUser(data?.id);
}

// Officer uploads are stored under the officer's folder; remove ones made by a test.
export async function removeUploadsNewerThan(userId, since) {
  const { data } = await adminClient().storage.from('grievance-photos').list(userId);
  const stale = (data || []).filter((f) => new Date(f.created_at) >= since).map((f) => `${userId}/${f.name}`);
  if (stale.length) await adminClient().storage.from('grievance-photos').remove(stale);
}

export async function getUserId(email) {
  const { data } = await adminClient().from('profiles').select('id').eq('email', email).single();
  return data.id;
}

export async function login(page, email, password = DEMO_PASSWORD, expectedPath = /dashboard/) {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(expectedPath);
}

export async function logout(page) {
  await page.getByRole('button', { name: /logout/i }).click();
  await expect(page).toHaveURL(/\/login/);
}
