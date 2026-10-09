import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, unwrap } from '../lib/errors.js';
import { toProfile } from '../lib/mappers.js';
import { str } from '../lib/validate.js';

// Mounted at /api, so auth is applied per route (not router-wide) to avoid
// turning every unknown /api/* URL into a 401.
const router = Router();

/** GET /api/me — the caller's profile (role, department, …). */
router.get('/me', requireAuth, async (req, res) => {
  const row = unwrap(await req.db.from('profiles').select('*').eq('id', req.user.id).maybeSingle());
  if (!row) throw new HttpError(404, 'Your account profile could not be found.');
  res.json(toProfile(row));
});

/**
 * GET /api/officers[?department=] — active field officers. Readable by staff
 * only (RLS returns an empty list to citizens).
 */
router.get('/officers', requireAuth, async (req, res) => {
  let query = req.db.from('profiles').select('*').eq('role', 'officer').eq('is_active', true).order('name');
  const department = str(req.query, 'department', { max: 100 });
  if (department) query = query.eq('department', department);
  res.json(unwrap(await query).map(toProfile));
});

export default router;
