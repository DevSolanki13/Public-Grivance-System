import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { unwrap } from '../lib/errors.js';
import { toNotification } from '../lib/mappers.js';
import { uuidParam } from '../lib/validate.js';

const router = Router();
router.use(requireAuth);

/** GET /api/notifications?limit=30 — the caller's latest notifications. */
router.get('/', async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const rows = unwrap(
    await req.db
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
  );
  res.json(rows.map(toNotification));
});

/** POST /api/notifications/read-all — mark every notification read. */
router.post('/read-all', async (req, res) => {
  unwrap(await req.db.from('notifications').update({ read: true }).eq('user_id', req.user.id).eq('read', false));
  res.status(204).end();
});

/** PATCH /api/notifications/:id/read — mark one notification read. */
router.patch('/:id/read', async (req, res) => {
  const id = uuidParam(req.params.id, 'notification id');
  unwrap(await req.db.from('notifications').update({ read: true }).eq('id', id));
  res.status(204).end();
});

export default router;
