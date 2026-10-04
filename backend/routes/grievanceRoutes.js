import { Router } from 'express';
import { GrievanceController } from '../controllers/grievanceController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

// Public citizen tracking (no login required)
router.get('/track/:complaintId', GrievanceController.trackPublic);

// Authenticated routes
router.use(authenticate);

router.get('/', GrievanceController.getAll);
router.get('/:id', GrievanceController.getById);

// Citizen filing grievance with photo evidence (up to 5 images)
router.post('/', upload.any(), GrievanceController.create);

// Status transition
router.patch('/:id/status', GrievanceController.updateStatus);

// Dept Head / Admin: Assign field officer
router.post(
  '/:id/assign',
  requireRole('admin', 'department_head'),
  GrievanceController.assignOfficer
);

// Officer / Admin: Submit resolution with photo proof (device camera or file upload)
router.post(
  '/:id/resolve',
  requireRole('admin', 'officer'),
  upload.any(),
  GrievanceController.resolveWithProof
);

// Citizen / Admin: Verify resolution satisfaction or reopen
router.post(
  '/:id/verify',
  requireRole('admin', 'citizen'),
  GrievanceController.verifyResolution
);

// Officer: Start work on assigned case
router.post(
  '/:id/start-work',
  requireRole('admin', 'officer'),
  GrievanceController.startWork
);

// Citizen: Reopen grievance directly
router.post(
  '/:id/reopen',
  requireRole('admin', 'citizen'),
  GrievanceController.reopen
);

export default router;
