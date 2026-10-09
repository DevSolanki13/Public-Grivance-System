/**
 * API: the Express server (server/app.js) against the real local Supabase.
 * Checks auth handling, HTTP status mapping, validation, and the full
 * grievance workflow through the REST endpoints.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/app.js';
import { DEMO, DEMO_PASSWORD, IDS, createCitizen, deleteUser } from '../integration/helpers.js';

const app = createApp();
const api = () => request(app);

let citizen;
let tokens;

// Logs in through the API itself and returns the bearer token.
async function tokenFor(email, password = DEMO_PASSWORD) {
  const res = await api().post('/api/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  return res.body.accessToken;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  citizen = await createCitizen('API Citizen');
  const { data } = await citizen.client.auth.getSession();
  tokens = {
    citizen: data.session.access_token,
    officer: await tokenFor(DEMO.sanitationOfficer),
    otherOfficer: await tokenFor(DEMO.otherSanitationOfficer),
    head: await tokenFor(DEMO.sanitationHead),
    roadsHead: await tokenFor(DEMO.roadsHead),
    admin: await tokenFor(DEMO.admin),
  };
});

afterAll(async () => {
  // Cascades to the grievances, events and notifications created below.
  await deleteUser(citizen?.id);
});

describe('basics', () => {
  it('GET /api/health is public', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('unknown routes return a JSON 404', async () => {
    const res = await api().get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/No route/);
  });

  it('malformed JSON returns 400', async () => {
    const res = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{bad json');
    expect(res.status).toBe(400);
  });

  it('sets security headers and allows the frontend origin via CORS', async () => {
    const res = await api().get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('authentication', () => {
  it('rejects requests without a token', async () => {
    const res = await api().get('/api/grievances');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const res = await api().get('/api/grievances').set(auth('not-a-real-token'));
    expect(res.status).toBe(401);
  });

  it('login with a wrong password returns 401', async () => {
    const res = await api().post('/api/auth/login').send({ email: DEMO.admin, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Incorrect email or password.');
  });

  it('login returns a token and the profile', async () => {
    const res = await api().post('/api/auth/login').send({ email: DEMO.sanitationHead, password: DEMO_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.profile).toMatchObject({ role: 'department_head', department: 'Sanitation Department' });
  });

  it('GET /api/me returns the caller profile', async () => {
    const res = await api().get('/api/me').set(auth(tokens.citizen));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: citizen.id, role: 'citizen', name: 'API Citizen' });
  });
});

describe('role scoping through the API', () => {
  it('officers list is visible to staff but empty for citizens', async () => {
    const staff = await api().get('/api/officers?department=Sanitation%20Department').set(auth(tokens.head));
    expect(staff.status).toBe(200);
    expect(staff.body.map((o) => o.name)).toEqual(['Neha Joshi', 'Rahul Sharma']);

    const asCitizen = await api().get('/api/officers').set(auth(tokens.citizen));
    expect(asCitizen.body).toEqual([]);
  });

  it('a department head only receives their department', async () => {
    const res = await api().get('/api/grievances').set(auth(tokens.roadsHead));
    expect(res.status).toBe(200);
    expect(new Set(res.body.map((g) => g.department))).toEqual(new Set(['PWD (Roads & Infrastructure)']));
  });

  it('the public feed needs no login and hides personal data', async () => {
    const res = await api().get('/api/public/grievances');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).not.toHaveProperty('citizenName');
    expect(res.body[0]).not.toHaveProperty('citizenEmail');
  });
});

describe('validation and error mapping', () => {
  it('400 when required fields are missing', async () => {
    const res = await api().post('/api/grievances').set(auth(tokens.citizen)).send({ category: 'Sanitation' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/"subject" is required/);
  });

  it('400 when the database rejects the values (too-short description)', async () => {
    const res = await api().post('/api/grievances').set(auth(tokens.citizen)).send({
      category: 'Sanitation', subject: 'Bin', description: 'short', location: 'Somewhere',
    });
    expect(res.status).toBe(400);
  });

  it('400 for an unknown category', async () => {
    const res = await api().post('/api/grievances').set(auth(tokens.citizen)).send({
      category: 'Teleportation', subject: 'Broken portal', description: 'The portal is broken again today.', location: 'Sector 1',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Unknown category or department.');
  });

  it('400 for a malformed id, 404 for a grievance that does not exist', async () => {
    expect((await api().get('/api/grievances/not-an-id').set(auth(tokens.citizen))).status).toBe(400);
    const missing = await api().get('/api/grievances/00000000-0000-4000-8000-000000000000').set(auth(tokens.citizen));
    expect(missing.status).toBe(404);
  });

  it('404 (not 403) when a citizen asks for someone else\'s grievance — existence is not leaked', async () => {
    const res = await api().get('/api/grievances/GRV-2026-00125').set(auth(tokens.citizen));
    expect(res.status).toBe(404);
  });
});

describe('full workflow over REST', () => {
  let id;

  it('citizen files a grievance → 201 with complaint ID and timeline', async () => {
    const res = await api().post('/api/grievances').set(auth(tokens.citizen)).send({
      category: 'Sanitation',
      subject: 'API test: drain blocked',
      description: 'The storm drain is blocked and water is collecting on the road.',
      location: 'Drain Road, Sector 3, API Nagar',
      latitude: 19.2,
      longitude: 72.85,
      imageUrl: 'https://example.com/drain.jpg',
    });
    expect(res.status).toBe(201);
    expect(res.body.complaintId).toMatch(/^GRV-\d{4}-\d{5}$/);
    expect(res.body).toMatchObject({ status: 'Submitted', department: 'Sanitation Department' });
    id = res.body.id;

    const byComplaintId = await api().get(`/api/grievances/${res.body.complaintId}`).set(auth(tokens.citizen));
    expect(byComplaintId.body.timeline.map((t) => t.status)).toEqual(['Submitted']);

    const mine = await api().get('/api/grievances?mine=true').set(auth(tokens.citizen));
    expect(mine.body.map((g) => g.id)).toContain(id);
  });

  it('wrong department head → 403; officer from another department → 400', async () => {
    const wrongHead = await api().post(`/api/grievances/${id}/assign`).set(auth(tokens.roadsHead))
      .send({ department: 'Sanitation Department', officerId: IDS.rahul });
    expect(wrongHead.status).toBe(403);

    const wrongOfficer = await api().post(`/api/grievances/${id}/assign`).set(auth(tokens.head))
      .send({ department: 'Sanitation Department', officerId: IDS.amit });
    expect(wrongOfficer.status).toBe(400);
    expect(wrongOfficer.body.error.message).toMatch(/does not belong/);
  });

  it('department head assigns → In Progress', async () => {
    const res = await api().post(`/api/grievances/${id}/assign`).set(auth(tokens.head))
      .send({ department: 'Sanitation Department', officerId: IDS.rahul, priority: 'High', remark: 'Clear it today.' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'In Progress', assignedOfficerName: 'Rahul Sharma', priority: 'High' });
    expect(res.body.timeline.map((t) => t.status)).toEqual(['Submitted', 'In Progress']);
  });

  it('assigned officer gets a notification and can mark it read', async () => {
    const list = await api().get('/api/notifications').set(auth(tokens.officer));
    const note = list.body.find((n) => n.grievanceId === id);
    expect(note).toMatchObject({ type: 'assignment', read: false });

    const mark = await api().patch(`/api/notifications/${note.id}/read`).set(auth(tokens.officer));
    expect(mark.status).toBe(204);
    const after = await api().get('/api/notifications').set(auth(tokens.officer));
    expect(after.body.find((n) => n.id === note.id).read).toBe(true);
  });

  it('another officer cannot resolve (403); the assigned one can (200)', async () => {
    const other = await api().post(`/api/grievances/${id}/resolve`).set(auth(tokens.otherOfficer))
      .send({ resolutionImageUrl: 'https://example.com/fixed.jpg', remark: 'Drain cleared.' });
    expect(other.status).toBe(403);

    const res = await api().post(`/api/grievances/${id}/resolve`).set(auth(tokens.officer))
      .send({ resolutionImageUrl: 'https://example.com/fixed.jpg', remark: 'Drain cleared and flushed.' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Resolved');
  });

  it('verify requires a boolean "approve"', async () => {
    const res = await api().post(`/api/grievances/${id}/verify`).set(auth(tokens.citizen)).send({ rating: 5 });
    expect(res.status).toBe(400);
  });

  it('citizen approves with a rating → Closed; verifying again → 400', async () => {
    const res = await api().post(`/api/grievances/${id}/verify`).set(auth(tokens.citizen))
      .send({ approve: true, rating: 5, comment: 'Quick work.' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'Closed', rating: 5 });
    expect(res.body.timeline.map((t) => t.status)).toEqual(['Submitted', 'In Progress', 'Resolved', 'Closed']);

    const again = await api().post(`/api/grievances/${id}/verify`).set(auth(tokens.citizen)).send({ approve: true, rating: 5 });
    expect(again.status).toBe(400);
  });

  it('admin can reject a new grievance with a reason', async () => {
    const created = await api().post('/api/grievances').set(auth(tokens.citizen)).send({
      category: 'Other', subject: 'API test: private dispute', description: 'A dispute between neighbours about parking.', location: 'Private Society, Sector 8',
    });
    const res = await api().post(`/api/grievances/${created.body.id}/reject`).set(auth(tokens.admin))
      .send({ reason: 'Private matter outside municipal jurisdiction.' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'Rejected', rejectionReason: 'Private matter outside municipal jurisdiction.' });
  });
});
