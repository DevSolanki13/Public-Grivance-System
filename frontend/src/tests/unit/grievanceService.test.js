/**
 * UNIT TESTS: grievanceService
 * The API client and Supabase are mocked, so these tests check which REST
 * endpoints the service calls and with what payloads — no backend needed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const apiMock = vi.fn();
const upload = vi.fn(() => Promise.resolve({ data: {}, error: null }));

vi.mock('../../lib/api', () => {
  class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }
  return { api: (...args) => apiMock(...args), ApiError };
});

vi.mock('../../lib/supabase', () => ({
  PHOTO_BUCKET: 'grievance-photos',
  supabase: {
    storage: {
      from: () => ({
        upload,
        getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.test/${path}` } }),
      }),
    },
  },
}));

const { grievanceService } = await import('../../services/grievanceService');
const { ApiError } = await import('../../lib/api');

beforeEach(() => {
  apiMock.mockReset();
  apiMock.mockResolvedValue({});
  upload.mockClear();
});

describe('reading grievances', () => {
  it('lists via GET /api/grievances, adding mine=true for citizen pages', async () => {
    await grievanceService.getGrievances();
    await grievanceService.getGrievances({ citizenId: 'c1' });
    expect(apiMock).toHaveBeenNthCalledWith(1, '/api/grievances', { query: { mine: undefined } });
    expect(apiMock).toHaveBeenNthCalledWith(2, '/api/grievances', { query: { mine: 'true' } });
  });

  it('getGrievanceById URL-encodes the id and returns the API result', async () => {
    apiMock.mockResolvedValue({ id: 'g1', complaintId: 'GRV-2026-01001' });
    const g = await grievanceService.getGrievanceById('GRV-2026-01001');
    expect(apiMock).toHaveBeenCalledWith('/api/grievances/GRV-2026-01001');
    expect(g.complaintId).toBe('GRV-2026-01001');
  });

  it('getGrievanceById returns null on 404/400 but rethrows other errors', async () => {
    apiMock.mockRejectedValueOnce(new ApiError(404, 'not found'));
    expect(await grievanceService.getGrievanceById('x')).toBeNull();
    apiMock.mockRejectedValueOnce(new ApiError(500, 'boom'));
    await expect(grievanceService.getGrievanceById('x')).rejects.toThrow('boom');
  });
});

describe('createGrievance()', () => {
  it('POSTs only citizen-editable fields, trimmed', async () => {
    await grievanceService.createGrievance({
      category: 'Sanitation', subject: '  Bin  ', description: ' Overflowing bin ', location: ' Market ',
      imageUrl: 'https://img/1.jpg', coordinates: { latitude: 19.1, longitude: 72.8 },
    });
    expect(apiMock).toHaveBeenCalledWith('/api/grievances', {
      method: 'POST',
      body: {
        category: 'Sanitation', subcategory: '', subject: 'Bin', description: 'Overflowing bin', location: 'Market',
        latitude: 19.1, longitude: 72.8, priority: 'Medium', imageUrl: 'https://img/1.jpg',
      },
    });
  });
});

describe('workflow endpoints', () => {
  it('assign / reject / resolve hit their POST endpoints', async () => {
    await grievanceService.assignGrievance('g1', { department: 'Sanitation Department', officerId: 'o1', priority: 'High', remark: '' });
    await grievanceService.rejectGrievance('g1', 'Out of jurisdiction');
    await grievanceService.resolveGrievance('g1', { resolutionImageUrl: 'https://x/y.jpg', remark: 'Done' });
    expect(apiMock.mock.calls).toEqual([
      ['/api/grievances/g1/assign', { method: 'POST', body: { department: 'Sanitation Department', officerId: 'o1', priority: 'High', remark: null } }],
      ['/api/grievances/g1/reject', { method: 'POST', body: { reason: 'Out of jurisdiction' } }],
      ['/api/grievances/g1/resolve', { method: 'POST', body: { resolutionImageUrl: 'https://x/y.jpg', remark: 'Done' } }],
    ]);
  });

  it('approve and reopen both use /verify with the approve flag', async () => {
    await grievanceService.approveResolution('g1', { rating: 4, comment: 'Good' });
    await grievanceService.reopenGrievance('g1', { reason: 'Still broken', imageUrl: '' });
    expect(apiMock.mock.calls).toEqual([
      ['/api/grievances/g1/verify', { method: 'POST', body: { approve: true, rating: 4, comment: 'Good' } }],
      ['/api/grievances/g1/verify', { method: 'POST', body: { approve: false, reopenReason: 'Still broken', reopenImageUrl: null } }],
    ]);
  });

  it('findSimilar skips the request when no category is chosen', async () => {
    expect(await grievanceService.findSimilar({ category: '' })).toEqual([]);
    expect(apiMock).not.toHaveBeenCalled();
  });
});

describe('uploadPhoto()', () => {
  it('uploads into the user folder in Supabase Storage and returns the public URL', async () => {
    const file = new File(['x'], 'pothole.PNG', { type: 'image/png' });
    const url = await grievanceService.uploadPhoto(file, 'user-1');
    expect(upload.mock.calls[0][0]).toMatch(/^user-1\/[0-9a-f-]{36}\.png$/);
    expect(url).toMatch(/^https:\/\/cdn\.test\/user-1\//);
  });

  it('rejects non-image files and files over 5MB without uploading', async () => {
    await expect(grievanceService.uploadPhoto(new File(['x'], 'a.pdf', { type: 'application/pdf' }), 'u')).rejects.toThrow(/valid image/);
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' });
    await expect(grievanceService.uploadPhoto(big, 'u')).rejects.toThrow(/5MB/);
    expect(upload).not.toHaveBeenCalled();
  });
});
