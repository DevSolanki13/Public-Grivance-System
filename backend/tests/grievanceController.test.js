/**
 * UNIT TESTS: Backend grievanceController.js
 * Tests all 5 grievance lifecycle controller functions:
 * - GET list / GET by ID / POST create / PATCH assign / POST resolve / POST verify
 */
import { describe, it, expect, vi } from 'vitest';
import {
  getGrievances,
  getGrievanceById,
  createGrievance,
  updateStatusAndAssign,
  resolveGrievance,
  verifyResolution,
} from '../controllers/grievanceController.js';

// Helper builders
function mockReq(overrides = {}) {
  return {
    query: {},
    params: {},
    body: {},
    user: { uid: 'demo-citizen-01', role: 'citizen', name: 'Aarav Patel' },
    ...overrides,
  };
}

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

// ─────────────────────────────────────────────────────────────
describe('getGrievances()', () => {
  it('returns 200 with success:true and data array', async () => {
    const req = mockReq({ query: { role: 'admin' } });
    const res = mockRes();

    await getGrievances(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number),
      })
    );
  });

  it('filters by role=citizen with citizenId', async () => {
    const req = mockReq({
      query: { role: 'citizen', citizenId: 'demo-citizen-01' },
    });
    const res = mockRes();

    await getGrievances(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result.success).toBe(true);
    expect(result.data.every((g) => g.citizenId === 'demo-citizen-01')).toBe(true);
  });

  it('filters by status=In Progress', async () => {
    const req = mockReq({ query: { status: 'In Progress' } });
    const res = mockRes();

    await getGrievances(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result.success).toBe(true);
    result.data.forEach((g) => {
      expect(g.status.toLowerCase()).toBe('in progress');
    });
  });
});

// ─────────────────────────────────────────────────────────────
describe('getGrievanceById()', () => {
  it('returns a grievance for a valid ID', async () => {
    const req = mockReq({ params: { id: 'grv-001' } });
    const res = mockRes();

    await getGrievanceById(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('grv-001');
  });

  it('returns 404 for an unknown ID', async () => {
    const req = mockReq({ params: { id: 'grv-nonexistent-9999' } });
    const res = mockRes();

    await getGrievanceById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const result = res.json.mock.calls[0][0];
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
describe('createGrievance()', () => {
  it('creates and returns a new grievance with status Submitted', async () => {
    const req = mockReq({
      body: {
        subject: 'Test broken pipe',
        description: 'Water pipe burst outside building.',
        category: 'Water Supply',
        location: 'Test Colony, Block C',
        priority: 'High',
        imageUrl: '',
        citizenName: 'Aarav Patel',
      },
      user: { uid: 'demo-citizen-01', role: 'citizen', name: 'Aarav Patel' },
    });
    const res = mockRes();

    await createGrievance(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const result = res.json.mock.calls[0][0];
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('Submitted');
    expect(result.data.subject).toBe('Test broken pipe');
  });

  it('complaint ID starts with GRV-', async () => {
    const req = mockReq({
      body: { subject: 'Light out', description: 'Pole #3 is dark.', category: 'Street Lights', location: 'Main Rd', priority: 'Medium' },
      user: { uid: 'citizen-01', role: 'citizen' },
    });
    const res = mockRes();

    await createGrievance(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result.data.complaintId).toMatch(/^GRV-/);
  });

  it('initializes timeline with one Submitted entry', async () => {
    const req = mockReq({
      body: { subject: 'Garbage pile', description: 'Pile of waste on street.', category: 'Sanitation', location: 'Market Road', priority: 'High' },
      user: { uid: 'citizen-02', role: 'citizen' },
    });
    const res = mockRes();

    await createGrievance(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result.data.timeline).toHaveLength(1);
    expect(result.data.timeline[0].status).toBe('Submitted');
  });
});

// ─────────────────────────────────────────────────────────────
describe('resolveGrievance()', () => {
  it('sets status to Resolved and stores resolutionImageUrl', async () => {
    const req = mockReq({
      params: { id: 'grv-001' },
      body: {
        resolutionImageUrl: 'https://example.com/after.jpg',
        officerRemark: 'Bin emptied and area sanitized.',
      },
      user: { uid: 'demo-officer-01', role: 'officer' },
    });
    const res = mockRes();

    await resolveGrievance(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('Resolved');
    expect(result.data.resolutionImageUrl).toBe('https://example.com/after.jpg');
  });
});

// ─────────────────────────────────────────────────────────────
describe('verifyResolution()', () => {
  it('closes the grievance when citizen approves', async () => {
    const req = mockReq({
      params: { id: 'grv-001' },
      body: { approved: true, rating: 4, feedbackComment: 'Fixed properly.' },
      user: { uid: 'demo-citizen-01', role: 'citizen' },
    });
    const res = mockRes();

    await verifyResolution(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('Closed');
    expect(result.data.rating).toBe(4);
  });

  it('reopens the grievance when citizen rejects', async () => {
    const req = mockReq({
      params: { id: 'grv-002' },
      body: { approved: false, rejectionReason: 'Issue still present.', rejectionImageUrl: 'https://example.com/reject.jpg' },
      user: { uid: 'demo-citizen-01', role: 'citizen' },
    });
    const res = mockRes();

    await verifyResolution(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('Reopened');
    expect(result.data.reopenReason).toBe('Issue still present.');
  });
});
