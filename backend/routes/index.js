import { Router } from 'express';
import authRoutes from './authRoutes.js';
import grievanceRoutes from './grievanceRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/grievances', grievanceRoutes);
apiRouter.use('/departments', departmentRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/notifications', notificationRoutes);

export default apiRouter;
