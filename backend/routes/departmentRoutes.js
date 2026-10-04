import { Router } from 'express';
import { DepartmentController } from '../controllers/departmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Departments & Categories can be queried publicly or with auth
router.get('/', DepartmentController.getDepartments);
router.get('/categories', DepartmentController.getCategories);
router.get('/officers', authenticate, DepartmentController.getOfficers);

export default router;
