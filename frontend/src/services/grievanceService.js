import { supabase, PHOTO_BUCKET } from '../lib/supabase';
import { api, ApiError } from '../lib/api';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// All grievance data goes through the Express API (backend/server), which
// queries Supabase as the signed-in user so Row Level Security applies.
export const grievanceService = {
  // citizenId: when set, only grievances the signed-in user filed (citizen pages).
  getGrievances({ citizenId } = {}) {
    return api('/api/grievances', { query: { mine: citizenId ? 'true' : undefined } });
  },

  // Accepts either the internal UUID or the public complaint ID (GRV-…).
  // Returns null when the grievance doesn't exist or isn't visible.
  async getGrievanceById(idOrComplaintId) {
    if (!idOrComplaintId) return null;
    try {
      return await api(`/api/grievances/${encodeURIComponent(idOrComplaintId)}`);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return null;
      throw err;
    }
  },

  createGrievance(form) {
    return api('/api/grievances', {
      method: 'POST',
      body: {
        category: form.category,
        subcategory: form.subcategory || '',
        subject: form.subject.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        latitude: form.coordinates?.latitude ?? null,
        longitude: form.coordinates?.longitude ?? null,
        priority: form.priority || 'Medium',
        imageUrl: form.imageUrl || '',
      },
    });
  },

  findSimilar({ category, coordinates, location }) {
    if (!category) return Promise.resolve([]);
    return api('/api/grievances/similar', {
      query: {
        category,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        location: location?.trim(),
      },
    });
  },

  assignGrievance(id, { department, officerId, priority, remark }) {
    return api(`/api/grievances/${id}/assign`, {
      method: 'POST',
      body: { department, officerId, priority: priority || null, remark: remark || null },
    });
  },

  rejectGrievance(id, reason) {
    return api(`/api/grievances/${id}/reject`, { method: 'POST', body: { reason } });
  },

  resolveGrievance(id, { resolutionImageUrl, remark }) {
    return api(`/api/grievances/${id}/resolve`, { method: 'POST', body: { resolutionImageUrl, remark } });
  },

  approveResolution(id, { rating, comment }) {
    return api(`/api/grievances/${id}/verify`, { method: 'POST', body: { approve: true, rating, comment: comment || null } });
  },

  reopenGrievance(id, { reason, imageUrl }) {
    return api(`/api/grievances/${id}/verify`, {
      method: 'POST',
      body: { approve: false, reopenReason: reason, reopenImageUrl: imageUrl || null },
    });
  },

  getOfficers({ department } = {}) {
    return api('/api/officers', { query: { department } });
  },

  // Anonymised feed used by the public transparency portal (works signed out).
  getPublicFeed() {
    return api('/api/public/grievances');
  },

  // Photos upload straight to Supabase Storage (into the user's own folder,
  // enforced by a storage policy); only the resulting URL goes to the API.
  async uploadPhoto(file, userId) {
    if (!file || !PHOTO_TYPES.includes(file.type)) {
      throw new Error('Please select a valid image file (JPG, PNG, WEBP or GIF).');
    }
    if (file.size > MAX_PHOTO_BYTES) {
      throw new Error('Image file size must be less than 5MB.');
    }
    const ext = (file.name?.split('.').pop() || file.type.split('/')[1] || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  },
};
