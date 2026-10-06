/**
 * UNIT TESTS: grievanceService (demo mode)
 * Tests the client-side service functions used by all role dashboards.
 * Uses demo mode (no real Firebase needed).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mock Firebase modules so no real SDK calls are made ──────────────────────
vi.mock('../../firebase/config', () => ({
  db: {},
  auth: {},
  storage: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(() => ({ id: 'mock-doc-id' })),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  query: vi.fn(),
  where: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
  Timestamp: { now: vi.fn(() => ({ seconds: 1000000 })) },
}));

import { grievanceService } from '../../services/grievanceService';

// Demo user context
const demoUser = { uid: 'demo-citizen-01', isDemo: true };
const demoOfficer = { uid: 'demo-officer-01', isDemo: true };
const demoAdmin = { uid: 'demo-admin-01', isDemo: true };

describe('grievanceService – demo mode', () => {
  describe('getGrievances()', () => {
    it('returns an array for citizen role', async () => {
      const list = await grievanceService.getGrievances({ user: demoUser, role: 'citizen' });
      expect(Array.isArray(list)).toBe(true);
    });

    it('returns an array for officer role', async () => {
      const list = await grievanceService.getGrievances({ user: demoOfficer, role: 'officer' });
      expect(Array.isArray(list)).toBe(true);
    });

    it('returns all grievances for admin role', async () => {
      const list = await grievanceService.getGrievances({ user: demoAdmin, role: 'admin' });
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
    });

    it('each grievance has required fields', async () => {
      const list = await grievanceService.getGrievances({ user: demoAdmin, role: 'admin' });
      for (const g of list) {
        expect(g).toHaveProperty('id');
        expect(g).toHaveProperty('complaintId');
        expect(g).toHaveProperty('status');
        expect(g).toHaveProperty('category');
        expect(g).toHaveProperty('subject');
      }
    });
  });

  describe('getGrievanceById()', () => {
    it('returns a grievance when found by complaintId', async () => {
      const g = await grievanceService.getGrievanceById('GRV-2026-00125', demoUser);
      expect(g).not.toBeNull();
      expect(g.complaintId).toBe('GRV-2026-00125');
    });

    it('returns null for a non-existent ID', async () => {
      const g = await grievanceService.getGrievanceById('GRV-NONEXISTENT', demoUser);
      expect(g).toBeNull();
    });
  });

  describe('createGrievance()', () => {
    it('creates a new grievance with "Submitted" status', async () => {
      const data = {
        subject: 'Test pothole on main road',
        description: 'Deep pothole near bus stop causing accidents.',
        category: 'Road & Infrastructure',
        location: 'Test Area, Sector 5',
        priority: 'High',
        imageUrl: '',
      };
      const profile = { name: 'Aarav Patel', email: 'aarav@test.com' };
      const result = await grievanceService.createGrievance(data, demoUser, profile);

      expect(result).toHaveProperty('id');
      expect(result.status).toBe('Submitted');
      expect(result.subject).toBe(data.subject);
      expect(result.category).toBe(data.category);
    });

    it('assigns a complaintId starting with GRV-', async () => {
      const data = {
        subject: 'Broken streetlight',
        description: 'Light pole #45 not working.',
        category: 'Street Lights',
        location: 'Highway Rd',
        priority: 'Medium',
        imageUrl: '',
      };
      const result = await grievanceService.createGrievance(data, demoUser, {});
      expect(result.complaintId).toMatch(/^GRV-/);
    });

    it('newly created grievance appears when fetching by ID', async () => {
      const data = {
        subject: 'Water pipe burst',
        description: 'Pipe burst near school.',
        category: 'Water Supply',
        location: 'School Road',
        priority: 'Critical',
        imageUrl: '',
      };
      const created = await grievanceService.createGrievance(data, demoUser, {});
      const fetched = await grievanceService.getGrievanceById(created.id, demoUser);
      expect(fetched).not.toBeNull();
      expect(fetched.id).toBe(created.id);
    });
  });

  describe('updateGrievance()', () => {
    it('updates the status of an existing demo grievance', async () => {
      const list = await grievanceService.getGrievances({ user: demoAdmin, role: 'admin' });
      const target = list[0];
      expect(target).toBeDefined();

      await grievanceService.updateGrievance(
        target.id,
        { status: 'Under Review', adminRemark: 'Assigned for triage.' },
        demoAdmin
      );

      const updated = await grievanceService.getGrievanceById(target.id, demoAdmin);
      expect(updated.status).toBe('Under Review');
      expect(updated.adminRemark).toBe('Assigned for triage.');
    });
  });
});
