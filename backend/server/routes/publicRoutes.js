import { Router } from 'express';
import { anonClient } from '../lib/supabase.js';
import { unwrap } from '../lib/errors.js';
import { toPublicGrievance } from '../lib/mappers.js';

const router = Router();

/** GET /api/public/grievances — anonymised feed for the transparency portal (no login). */
router.get('/grievances', async (_req, res) => {
  const rows = unwrap(await anonClient.rpc('public_grievance_feed'));
  res.set('Cache-Control', 'public, max-age=30');
  res.json((rows || []).map(toPublicGrievance));
});

export default router;
