import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, unwrap } from '../lib/errors.js';
import { toGrievance } from '../lib/mappers.js';
import { grievanceIdParam, num, str, uuidParam } from '../lib/validate.js';

const router = Router();
router.use(requireAuth);

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

async function loadGrievance(db, column, value) {
  const row = unwrap(
    await db.from('grievances').select('*, grievance_events(*)').eq(column, value).maybeSingle()
  );
  if (!row) throw new HttpError(404, 'Grievance not found, or you do not have access to it.');
  return toGrievance(row);
}

// Runs a workflow function, then returns the updated grievance with its timeline.
async function runWorkflow(req, fn, params) {
  const id = uuidParam(req.params.id, 'grievance id');
  unwrap(await req.db.rpc(fn, { p_grievance_id: id, ...params }));
  return loadGrievance(req.db, 'id', id);
}

/**
 * GET /api/grievances[?mine=true]
 * Grievances visible to the caller (RLS: citizen → own, officer → assigned,
 * department head → department, admin → all). mine=true limits to cases the
 * caller filed.
 */
router.get('/', async (req, res) => {
  let query = req.db.from('grievances').select('*').order('created_at', { ascending: false });
  if (req.query.mine === 'true') query = query.eq('citizen_id', req.user.id);
  res.json(unwrap(await query).map(toGrievance));
});

/**
 * GET /api/grievances/similar?category=&latitude=&longitude=&location=
 * Open grievances of the same category nearby (duplicate warning).
 */
router.get('/similar', async (req, res) => {
  const category = str(req.query, 'category', { required: true, max: 100 });
  const data = unwrap(
    await req.db.rpc('find_similar_grievances', {
      p_category: category,
      p_latitude: num(req.query, 'latitude') ?? null,
      p_longitude: num(req.query, 'longitude') ?? null,
      p_location: str(req.query, 'location', { max: 500 })?.trim() || null,
    })
  );
  res.json(
    (data || []).map((r) => ({
      id: r.id,
      complaintId: r.complaint_id,
      subject: r.subject,
      status: r.status,
      location: r.location,
      isOwn: r.is_own,
    }))
  );
});

/** GET /api/grievances/:id — by UUID or complaint ID (GRV-…), with timeline. */
router.get('/:id', async (req, res) => {
  const { column, value } = grievanceIdParam(req.params.id);
  res.json(await loadGrievance(req.db, column, value));
});

/** POST /api/grievances — citizen files a new grievance. */
router.post('/', async (req, res) => {
  const b = req.body || {};
  const priority = str(b, 'priority', { max: 20 }) || 'Medium';
  if (!PRIORITIES.includes(priority)) throw new HttpError(400, 'Invalid priority.');

  const row = unwrap(
    await req.db
      .from('grievances')
      .insert({
        citizen_id: req.user.id,
        category: str(b, 'category', { required: true, max: 100 }),
        subcategory: str(b, 'subcategory', { max: 100 }) || '',
        subject: str(b, 'subject', { required: true, max: 200 }).trim(),
        description: str(b, 'description', { required: true }).trim(),
        location: str(b, 'location', { required: true, max: 500 }).trim(),
        latitude: num(b, 'latitude') ?? null,
        longitude: num(b, 'longitude') ?? null,
        priority,
        image_url: str(b, 'imageUrl', { max: 2000 }) || '',
      })
      .select()
      .single()
  );
  res.status(201).json(toGrievance(row));
});

/** POST /api/grievances/:id/assign — dept head / admin assigns an officer. */
router.post('/:id/assign', async (req, res) => {
  const b = req.body || {};
  res.json(
    await runWorkflow(req, 'assign_grievance', {
      p_department: str(b, 'department', { required: true, max: 100 }),
      p_officer_id: uuidParam(str(b, 'officerId', { required: true, max: 36 }), 'officerId'),
      p_priority: str(b, 'priority', { max: 20 }) || null,
      p_remark: str(b, 'remark', { max: 2000 }) || null,
    })
  );
});

/** POST /api/grievances/:id/reject — dept head / admin rejects during triage. */
router.post('/:id/reject', async (req, res) => {
  res.json(await runWorkflow(req, 'reject_grievance', { p_reason: str(req.body, 'reason', { max: 2000 }) || '' }));
});

/** POST /api/grievances/:id/resolve — assigned officer uploads proof. */
router.post('/:id/resolve', async (req, res) => {
  const b = req.body || {};
  res.json(
    await runWorkflow(req, 'resolve_grievance', {
      p_resolution_image_url: str(b, 'resolutionImageUrl', { max: 2000 }) || '',
      p_remark: str(b, 'remark', { max: 2000 }) || '',
    })
  );
});

/**
 * POST /api/grievances/:id/verify — citizen approves (closes, with rating)
 * or rejects (reopens, with reason) the resolution.
 */
router.post('/:id/verify', async (req, res) => {
  const b = req.body || {};
  if (typeof b.approve !== 'boolean') throw new HttpError(400, '"approve" must be true or false.');
  res.json(
    await runWorkflow(req, 'verify_resolution', {
      p_approve: b.approve,
      p_rating: num(b, 'rating') ?? null,
      p_comment: str(b, 'comment', { max: 2000 }) || null,
      p_reopen_reason: str(b, 'reopenReason', { max: 2000 }) || null,
      p_reopen_image_url: str(b, 'reopenImageUrl', { max: 2000 }) || null,
    })
  );
});

export default router;
