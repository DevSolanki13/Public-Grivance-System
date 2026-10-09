/**
 * INTEGRATION: full grievance lifecycle across all four roles, exercised
 * through the same Supabase API the browser uses (RLS + workflow RPCs).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEMO, IDS, signIn, createCitizen, deleteUser, fileGrievance, anonClient } from './helpers';

let citizen;
let otherCitizen;
let officer;
let otherOfficer;
let head;
let roadsHead;
let admin;

beforeAll(async () => {
  citizen = await createCitizen('Lifecycle Citizen');
  otherCitizen = await createCitizen('Other Citizen');
  officer = await signIn(DEMO.sanitationOfficer);
  otherOfficer = await signIn(DEMO.otherSanitationOfficer);
  head = await signIn(DEMO.sanitationHead);
  roadsHead = await signIn(DEMO.roadsHead);
  admin = await signIn(DEMO.admin);
});

afterAll(async () => {
  // Cascades to every grievance, event and notification these users created.
  await deleteUser(citizen?.id);
  await deleteUser(otherCitizen?.id);
});

const rpcError = async (promise) => (await promise).error;

describe('filing a grievance', () => {
  it('generates a complaint ID, routes to the category department and logs a Submitted event', async () => {
    const g = await fileGrievance(citizen);
    expect(g.complaint_id).toMatch(/^GRV-\d{4}-\d{5}$/);
    expect(g.status).toBe('Submitted');
    expect(g.department).toBe('Sanitation Department');
    expect(g.citizen_name).toBe('Lifecycle Citizen');

    const { data: events } = await citizen.client.from('grievance_events').select('*').eq('grievance_id', g.id);
    expect(events.map((e) => e.status)).toEqual(['Submitted']);
  });

  it('ignores server-controlled fields sent by the client (status, officer, rating)', async () => {
    const g = await fileGrievance(citizen, {
      status: 'Closed',
      assigned_officer_id: IDS.rahul,
      assigned_officer_name: 'Rahul Sharma',
      rating: 5,
      department: 'Water Department',
      citizen_name: 'Someone Else',
    });
    expect(g.status).toBe('Submitted');
    expect(g.assigned_officer_id).toBeNull();
    expect(g.rating).toBeNull();
    expect(g.department).toBe('Sanitation Department');
    expect(g.citizen_name).toBe('Lifecycle Citizen');
  });

  it('rejects filing on behalf of another user', async () => {
    const { error } = await citizen.client
      .from('grievances')
      .insert({ citizen_id: otherCitizen.id, category: 'Sanitation', subject: 'Spoofed', description: 'Filed for someone else entirely.', location: 'Nowhere Road' });
    expect(error).toBeTruthy();
  });

  it('rejects invalid input (too-short description, javascript: image URL)', async () => {
    const short = await citizen.client.from('grievances').insert({
      citizen_id: citizen.id, category: 'Sanitation', subject: 'Short', description: 'too short', location: 'Somewhere',
    });
    expect(short.error).toBeTruthy();

    const badUrl = await citizen.client.from('grievances').insert({
      citizen_id: citizen.id, category: 'Sanitation', subject: 'Bad image', description: 'Description that is long enough.',
      location: 'Somewhere', image_url: 'javascript:alert(1)',
    });
    expect(badUrl.error).toBeTruthy();
  });

  it('notifies the department head of the new case', async () => {
    const g = await fileGrievance(citizen);
    const { data } = await head.client.from('notifications').select('*').eq('grievance_id', g.id);
    expect(data.some((n) => n.type === 'assignment')).toBe(true);
  });
});

describe('end-to-end lifecycle: assign → resolve → reopen → resolve → close', () => {
  let g;

  beforeAll(async () => {
    g = await fileGrievance(citizen, { subject: 'Lifecycle: garbage pile' });
  });

  it('officer cannot see the case before it is assigned to them', async () => {
    const { data } = await officer.client.from('grievances').select('id').eq('id', g.id);
    expect(data).toEqual([]);
  });

  it('a department head from another department cannot assign it', async () => {
    const error = await rpcError(roadsHead.client.rpc('assign_grievance', {
      p_grievance_id: g.id, p_department: 'Sanitation Department', p_officer_id: IDS.rahul,
    }));
    expect(error?.code).toBe('42501');
  });

  it('cannot be assigned to an officer from a different department', async () => {
    const error = await rpcError(head.client.rpc('assign_grievance', {
      p_grievance_id: g.id, p_department: 'Sanitation Department', p_officer_id: IDS.amit,
    }));
    expect(error?.message).toMatch(/does not belong/);
  });

  it('the owning department head assigns an officer → In Progress', async () => {
    const { data, error } = await head.client.rpc('assign_grievance', {
      p_grievance_id: g.id, p_department: 'Sanitation Department', p_officer_id: IDS.rahul,
      p_priority: 'High', p_remark: 'Clear the pile today.',
    });
    expect(error).toBeNull();
    expect(data.status).toBe('In Progress');
    expect(data.assigned_officer_name).toBe('Rahul Sharma');
    expect(data.priority).toBe('High');

    const { data: officerView } = await officer.client.from('grievances').select('id').eq('id', g.id);
    expect(officerView).toHaveLength(1);

    const { data: notes } = await officer.client.from('notifications').select('*').eq('grievance_id', g.id);
    expect(notes.some((n) => n.type === 'assignment')).toBe(true);
  });

  it('only the assigned officer can resolve, and a proof photo + remark are required', async () => {
    const byOtherOfficer = await rpcError(otherOfficer.client.rpc('resolve_grievance', {
      p_grievance_id: g.id, p_resolution_image_url: 'https://example.com/fixed.jpg', p_remark: 'Cleaned up.',
    }));
    expect(byOtherOfficer?.code).toBe('42501');

    const byCitizen = await rpcError(citizen.client.rpc('resolve_grievance', {
      p_grievance_id: g.id, p_resolution_image_url: 'https://example.com/fixed.jpg', p_remark: 'Cleaned up.',
    }));
    expect(byCitizen?.code).toBe('42501');

    const noPhoto = await rpcError(officer.client.rpc('resolve_grievance', {
      p_grievance_id: g.id, p_resolution_image_url: '', p_remark: 'Cleaned up.',
    }));
    expect(noPhoto?.message).toMatch(/photo is required/);
  });

  it('the assigned officer resolves → Resolved and the citizen is asked to verify', async () => {
    const { data, error } = await officer.client.rpc('resolve_grievance', {
      p_grievance_id: g.id, p_resolution_image_url: 'https://example.com/fixed.jpg', p_remark: 'Pile cleared and area disinfected.',
    });
    expect(error).toBeNull();
    expect(data.status).toBe('Resolved');
    expect(data.resolved_at).toBeTruthy();

    const { data: notes } = await citizen.client.from('notifications').select('*').eq('grievance_id', g.id).eq('type', 'action_required');
    expect(notes).toHaveLength(1);
  });

  it('another citizen cannot verify someone else\'s grievance', async () => {
    const error = await rpcError(otherCitizen.client.rpc('verify_resolution', { p_grievance_id: g.id, p_approve: true, p_rating: 5 }));
    expect(error?.code).toBe('42501');
  });

  it('the citizen rejects the work → Reopened (reason required)', async () => {
    const noReason = await rpcError(citizen.client.rpc('verify_resolution', { p_grievance_id: g.id, p_approve: false }));
    expect(noReason?.message).toMatch(/explain/);

    const { data, error } = await citizen.client.rpc('verify_resolution', {
      p_grievance_id: g.id, p_approve: false, p_reopen_reason: 'Waste dumped again behind the bin.',
      p_reopen_image_url: 'https://example.com/still-dirty.jpg',
    });
    expect(error).toBeNull();
    expect(data.status).toBe('Reopened');
    expect(data.reopened_count).toBe(1);
    expect(data.reopen_reason).toBe('Waste dumped again behind the bin.');
  });

  it('the officer resolves again and the citizen approves with a rating → Closed', async () => {
    const resolved = await officer.client.rpc('resolve_grievance', {
      p_grievance_id: g.id, p_resolution_image_url: 'https://example.com/fixed-2.jpg', p_remark: 'Second clean-up done, bin replaced.',
    });
    expect(resolved.error).toBeNull();

    const badRating = await rpcError(citizen.client.rpc('verify_resolution', { p_grievance_id: g.id, p_approve: true, p_rating: 9 }));
    expect(badRating?.message).toMatch(/between 1 and 5/);

    const { data, error } = await citizen.client.rpc('verify_resolution', {
      p_grievance_id: g.id, p_approve: true, p_rating: 4, p_comment: 'Fixed properly this time.',
    });
    expect(error).toBeNull();
    expect(data.status).toBe('Closed');
    expect(data.rating).toBe(4);
    expect(data.closed_at).toBeTruthy();
  });

  it('records the full timeline in order', async () => {
    const { data: events } = await citizen.client
      .from('grievance_events').select('status').eq('grievance_id', g.id).order('created_at').order('id');
    expect(events.map((e) => e.status)).toEqual(['Submitted', 'In Progress', 'Resolved', 'Reopened', 'Resolved', 'Closed']);
  });

  it('a closed case cannot be resolved or verified again', async () => {
    const again = await rpcError(citizen.client.rpc('verify_resolution', { p_grievance_id: g.id, p_approve: true, p_rating: 5 }));
    expect(again?.message).toMatch(/not awaiting verification/);
  });

  it('appears on the public feed with its details once closed', async () => {
    const { data } = await anonClient().rpc('public_grievance_feed');
    const row = data.find((r) => r.complaint_id === g.complaint_id);
    expect(row.status).toBe('Closed');
    expect(row.subject).toBe('Lifecycle: garbage pile');
    expect(row).not.toHaveProperty('citizen_name');
  });
});

describe('rejecting a grievance', () => {
  it('requires a reason, only works during triage, and notifies the citizen', async () => {
    const g = await fileGrievance(citizen, { subject: 'Rejectable request' });

    const noReason = await rpcError(head.client.rpc('reject_grievance', { p_grievance_id: g.id, p_reason: '' }));
    expect(noReason?.message).toMatch(/reason/);

    const { data, error } = await admin.client.rpc('reject_grievance', { p_grievance_id: g.id, p_reason: 'Private property, outside jurisdiction.' });
    expect(error).toBeNull();
    expect(data.status).toBe('Rejected');
    expect(data.rejection_reason).toBe('Private property, outside jurisdiction.');

    const again = await rpcError(admin.client.rpc('reject_grievance', { p_grievance_id: g.id, p_reason: 'Twice rejected?' }));
    expect(again?.message).toMatch(/awaiting triage/);

    const { data: notes } = await citizen.client.from('notifications').select('*').eq('grievance_id', g.id).eq('type', 'escalation');
    expect(notes).toHaveLength(1);
  });

  it('an in-progress grievance cannot be rejected', async () => {
    const g = await fileGrievance(citizen, { subject: 'Assigned then rejected?' });
    await admin.client.rpc('assign_grievance', { p_grievance_id: g.id, p_department: 'Sanitation Department', p_officer_id: IDS.neha });
    const error = await rpcError(admin.client.rpc('reject_grievance', { p_grievance_id: g.id, p_reason: 'Too late to reject.' }));
    expect(error?.code).toBe('22023');
  });
});

describe('duplicate detection', () => {
  it('finds an open grievance of the same category nearby without leaking personal data', async () => {
    const g = await fileGrievance(citizen, { subject: 'Nearby duplicate target', latitude: 18.5, longitude: 73.5 });
    const { data, error } = await otherCitizen.client.rpc('find_similar_grievances', {
      p_category: 'Sanitation', p_latitude: 18.501, p_longitude: 73.501, p_location: null,
    });
    expect(error).toBeNull();
    const match = data.find((r) => r.id === g.id);
    expect(match).toBeTruthy();
    expect(match.is_own).toBe(false);
    expect(Object.keys(match).sort()).toEqual(['complaint_id', 'id', 'is_own', 'location', 'status', 'subject']);
  });
});
