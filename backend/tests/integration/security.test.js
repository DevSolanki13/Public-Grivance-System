/**
 * INTEGRATION: Row Level Security, privilege and storage rules.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEMO, signIn, createCitizen, deleteUser, fileGrievance, anonClient, adminClient } from './helpers';

let citizen;
let otherCitizen;
let officer;
let roadsHead;
let ownGrievance;

beforeAll(async () => {
  citizen = await createCitizen('Security Citizen');
  otherCitizen = await createCitizen('Nosy Citizen');
  officer = await signIn(DEMO.sanitationOfficer);
  roadsHead = await signIn(DEMO.roadsHead);
  ownGrievance = await fileGrievance(citizen, { subject: 'Security test grievance' });
});

afterAll(async () => {
  // Remove any test uploads, then the users (cascades to their data).
  for (const user of [citizen, otherCitizen]) {
    if (!user) continue;
    const { data } = await adminClient.storage.from('grievance-photos').list(user.id);
    if (data?.length) {
      await adminClient.storage.from('grievance-photos').remove(data.map((f) => `${user.id}/${f.name}`));
    }
  }
  await deleteUser(citizen?.id);
  await deleteUser(otherCitizen?.id);
});

describe('anonymous visitors', () => {
  it('cannot read grievances, profiles, events or notifications', async () => {
    const anon = anonClient();
    for (const table of ['grievances', 'profiles', 'grievance_events', 'notifications']) {
      const { data, error } = await anon.from(table).select('*').limit(1);
      expect(error || data.length === 0, `${table} should not be readable`).toBeTruthy();
    }
  });

  it('can read the anonymised public feed, which hides details of open cases', async () => {
    const { data, error } = await anonClient().rpc('public_grievance_feed');
    expect(error).toBeNull();
    const open = data.find((r) => r.complaint_id === ownGrievance.complaint_id);
    expect(open.status).toBe('Submitted');
    expect(open.subject).toBeNull();
    expect(open.location).toBeNull();
    expect(open.image_url).toBeNull();
  });

  it('cannot call workflow functions', async () => {
    const { error } = await anonClient().rpc('reject_grievance', { p_grievance_id: ownGrievance.id, p_reason: 'anon attempt' });
    expect(error).toBeTruthy();
  });
});

describe('citizens', () => {
  it('only see their own grievances', async () => {
    const { data } = await otherCitizen.client.from('grievances').select('id').eq('id', ownGrievance.id);
    expect(data).toEqual([]);
    const { data: events } = await otherCitizen.client.from('grievance_events').select('id').eq('grievance_id', ownGrievance.id);
    expect(events).toEqual([]);
  });

  it('cannot update a grievance directly (status changes only via workflow functions)', async () => {
    const { error } = await citizen.client.from('grievances').update({ status: 'Closed' }).eq('id', ownGrievance.id);
    expect(error).toBeTruthy();
    const { data } = await citizen.client.from('grievances').select('status').eq('id', ownGrievance.id).single();
    expect(data.status).toBe('Submitted');
  });

  it('cannot delete a grievance', async () => {
    await citizen.client.from('grievances').delete().eq('id', ownGrievance.id);
    const { data } = await adminClient.from('grievances').select('id').eq('id', ownGrievance.id);
    expect(data).toHaveLength(1);
  });

  it('can edit their name but cannot promote themselves to admin', async () => {
    const rename = await citizen.client.from('profiles').update({ name: 'Renamed Citizen' }).eq('id', citizen.id);
    expect(rename.error).toBeNull();

    const escalate = await citizen.client.from('profiles').update({ role: 'admin' }).eq('id', citizen.id);
    expect(escalate.error?.message).toMatch(/Only administrators/);

    const { data } = await adminClient.from('profiles').select('role, name').eq('id', citizen.id).single();
    expect(data).toEqual({ role: 'citizen', name: 'Renamed Citizen' });
  });

  it('get a citizen role on sign-up even when requesting another role', async () => {
    const anon = anonClient();
    const email = `it-signup-${Date.now()}@test.jansewa.in`;
    const { data, error } = await anon.auth.signUp({
      email, password: 'Sup3r-Secret!', options: { data: { name: 'Sneaky', role: 'admin' } },
    });
    expect(error).toBeNull();
    try {
      const { data: profile } = await adminClient.from('profiles').select('role').eq('id', data.user.id).single();
      expect(profile.role).toBe('citizen');
    } finally {
      await deleteUser(data.user.id);
    }
  });

  it('cannot read other users\' profiles', async () => {
    const { data } = await citizen.client.from('profiles').select('id');
    expect(data.map((p) => p.id)).toEqual([citizen.id]);
  });

  it('cannot create notifications, and can only mark their own as read', async () => {
    const insert = await citizen.client.from('notifications').insert({ user_id: otherCitizen.id, title: 'x', message: 'spam' });
    expect(insert.error).toBeTruthy();

    const { data: mine } = await citizen.client.from('notifications').select('*').eq('grievance_id', ownGrievance.id);
    expect(mine.length).toBeGreaterThan(0);

    const markRead = await citizen.client.from('notifications').update({ read: true }).eq('id', mine[0].id).select().single();
    expect(markRead.data.read).toBe(true);

    const editTitle = await citizen.client.from('notifications').update({ title: 'Edited' }).eq('id', mine[0].id);
    expect(editTitle.error).toBeTruthy();
  });
});

describe('staff scoping', () => {
  it('an officer sees only grievances assigned to them', async () => {
    const { data } = await officer.client.from('grievances').select('assigned_officer_id');
    expect(data.length).toBeGreaterThan(0);
    expect(new Set(data.map((g) => g.assigned_officer_id))).toEqual(new Set([officer.user.id]));
  });

  it('a department head sees only their department', async () => {
    const { data } = await roadsHead.client.from('grievances').select('department');
    expect(data.length).toBeGreaterThan(0);
    expect(new Set(data.map((g) => g.department))).toEqual(new Set(['PWD (Roads & Infrastructure)']));
  });

  it('an officer cannot assign cases', async () => {
    const { error } = await officer.client.rpc('assign_grievance', {
      p_grievance_id: ownGrievance.id, p_department: 'Sanitation Department', p_officer_id: officer.user.id,
    });
    expect(error?.code).toBe('42501');
  });
});

describe('photo storage', () => {
  const png = new Blob([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' });

  it('lets a user upload into their own folder', async () => {
    const { error } = await citizen.client.storage.from('grievance-photos').upload(`${citizen.id}/test.png`, png, { contentType: 'image/png' });
    expect(error).toBeNull();
  });

  it('blocks uploads into another user\'s folder', async () => {
    const { error } = await citizen.client.storage.from('grievance-photos').upload(`${otherCitizen.id}/evil.png`, png, { contentType: 'image/png' });
    expect(error).toBeTruthy();
  });

  it('rejects non-image files', async () => {
    const html = new Blob(['<script>alert(1)</script>'], { type: 'text/html' });
    const { error } = await citizen.client.storage.from('grievance-photos').upload(`${citizen.id}/x.html`, html, { contentType: 'text/html' });
    expect(error).toBeTruthy();
  });
});
