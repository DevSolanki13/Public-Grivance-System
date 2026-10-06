/**
 * UNIT TESTS: Backend authMiddleware.js
 * Tests role-based access control logic for all 4 civic personas.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

// Helper to build mock Express req/res/next objects
function mockReq(headers = {}) {
  return { headers };
}

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

describe('authenticate middleware', () => {
  it('sets demo citizen user when no Authorization header', () => {
    const req = mockReq({ 'x-user-id': 'demo-citizen-01', 'x-user-role': 'citizen' });
    const res = mockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user.uid).toBe('demo-citizen-01');
    expect(req.user.role).toBe('citizen');
  });

  it('falls back to demo-citizen-01 when no custom headers', () => {
    const req = mockReq({});
    const res = mockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user.uid).toBe('demo-citizen-01');
  });

  it('rejects when Authorization header has empty token', () => {
    const req = mockReq({ authorization: 'Bearer ' });
    const res = mockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(next).not.toHaveBeenCalled();
  });
});

describe('authorizeRoles middleware', () => {
  it('calls next() for a matching role', () => {
    const middleware = authorizeRoles('officer', 'admin');
    const req = { user: { uid: 'off-01', role: 'officer' } };
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 403 for a non-matching role', () => {
    const middleware = authorizeRoles('admin');
    const req = { user: { uid: 'citizen-01', role: 'citizen' } };
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when req.user is missing', () => {
    const middleware = authorizeRoles('officer');
    const req = {};
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows admin to access all routes', () => {
    const roles = ['citizen', 'officer', 'department_head', 'admin'];
    roles.forEach((allowedRole) => {
      const middleware = authorizeRoles(allowedRole);
      const req = { user: { uid: 'admin-01', role: allowedRole } };
      const res = mockRes();
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalledOnce();
    });
  });
});
