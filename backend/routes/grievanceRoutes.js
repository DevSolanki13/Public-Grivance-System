import { Router } from 'express';
import { GrievanceController } from '../controllers/grievanceController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { uploadEvidence, uploadProof, verifyUploadedImages } from '../middleware/uploadMiddleware.js';

const router = Router();

// Public citizen tracking (no login required; personal data masked for privacy)
router.get('/track/:complaintId', GrievanceController.trackPublic);

// Authenticated civic routes
router.use(authenticate);

router.get('/', GrievanceController.getAll);
router.get('/:id', GrievanceController.getById);

// Citizen filing grievance with photo evidence (max 5 photos)
router.post(
  '/',
  requireRole('citizen', 'admin'),
  uploadEvidence,
  verifyUploadedImages,
  GrievanceController.create
);

// Status transition
router.patch('/:id/status', GrievanceController.updateStatus);

// Dept Head / Admin: Assign field officer
router.post(
  '/:id/assign',
  requireRole('admin', 'department_head'),
  GrievanceController.assignOfficer
);

// Officer / Admin: Submit resolution with photo proof
router.post(
  '/:id/resolve',
  requireRole('admin', 'officer'),
  uploadProof,
  verifyUploadedImages,
  GrievanceController.resolveWithProof
);

// Citizen / Admin: Verify resolution satisfaction
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
