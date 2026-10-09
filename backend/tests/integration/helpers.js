import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error('Integration tests need SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY (see backend/.env.example)');
}

export const DEMO_PASSWORD = 'Demo@12345';

export const DEMO = {
  citizen: 'aarav.citizen@demo.jansewa.in',
  sanitationOfficer: 'rahul.officer@demo.jansewa.in',
  otherSanitationOfficer: 'neha.officer@demo.jansewa.in',
  roadsOfficer: 'amit.officer@demo.jansewa.in',
  sanitationHead: 'priya.head@demo.jansewa.in',
  roadsHead: 'karan.head@demo.jansewa.in',
  admin: 'admin@demo.jansewa.in',
};

export const IDS = {
  rahul: '22222222-2222-4222-8222-000000000001',
  neha: '22222222-2222-4222-8222-000000000005',
  amit: '22222222-2222-4222-8222-000000000002',
  priya: '33333333-3333-4333-8333-000000000001',
};

const noPersist = { auth: { persistSession: false, autoRefreshToken: false } };

export const anonClient = () => createClient(url, anonKey, noPersist);

// Service-role client: bypasses RLS. Used ONLY for test setup/teardown.
export const adminClient = createClient(url, serviceKey, noPersist);

export async function signIn(email, password = DEMO_PASSWORD) {
  const client = anonClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Sign-in failed for ${email}: ${error.message}`);
  return { client, user: data.user };
}

// Creates a throwaway citizen. Delete it with deleteUser() in teardown; that
// cascades to its profile, grievances, events and notifications.
export async function createCitizen(name = 'Integration Citizen') {
  const email = `it-${randomUUID()}@test.jansewa.in`;
  const password = `Pw-${randomUUID()}`;
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, phone: '9000000000' },
  });
  if (error) throw error;
  const session = await signIn(email, password);
  return { ...session, id: data.user.id, email };
}

export async function deleteUser(id) {
  if (!id) return;
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) throw error;
}

export const validGrievance = (overrides = {}) => ({
  category: 'Sanitation',
  subject: 'Integration test: overflowing bin',
  description: 'Bin has been overflowing for several days near the test site.',
  location: 'Test Lane, Sector 9, Integration Nagar',
  latitude: 19.1,
  longitude: 72.9,
  image_url: 'https://example.com/problem.jpg',
  ...overrides,
});

export async function fileGrievance(citizen, overrides = {}) {
  const { data, error } = await citizen.client
    .from('grievances')
    .insert({ citizen_id: citizen.id, ...validGrievance(overrides) })
    .select()
    .single();
  if (error) throw error;
  return data;
}
