import express from 'express';
import {
  getGrievances,
  getGrievanceById,
  createGrievance,
  updateStatusAndAssign,
  resolveGrievance,
  verifyResolution
} from '../controllers/grievanceController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES } from '../models/User.js';

const router = express.Router();

// GET all grievances (filtered by role / query parameters)
router.get('/', authenticate, getGrievances);

// GET single grievance by ID or complaintId
router.get('/:id', authenticate, getGrievanceById);

// POST submit a new grievance (Citizen / Public)
router.post('/', authenticate, createGrievance);

// PATCH triage, assign department or field officer (Dept Head / Admin)
router.patch(
  '/:id/assign',
  authenticate,
  authorizeRoles(ROLES.DEPARTMENT_HEAD, ROLES.ADMIN),
  updateStatusAndAssign
);

// POST field officer completes work with resolution photo proof
router.post(
  '/:id/resolve',
  authenticate,
  authorizeRoles(ROLES.OFFICER, ROLES.ADMIN),
  resolveGrievance
);

// POST citizen verifies work (Approve & Close or Reject & Reopen)
router.post(
  '/:id/verify',
  authenticate,
  authorizeRoles(ROLES.CITIZEN, ROLES.ADMIN),
  verifyResolution
);

export default router;
