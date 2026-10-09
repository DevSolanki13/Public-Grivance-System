import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import grievanceRoutes from './routes/grievances.js';
import notificationRoutes from './routes/notifications.js';
import userRoutes from './routes/users.js';
import publicRoutes from './routes/publicRoutes.js';
import authRoutes from './routes/auth.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Builds the Express app (exported separately from server.js so tests can use it).
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.clientOrigins }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'JanSewa API', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/grievances', grievanceRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api', userRoutes); // /api/me, /api/officers

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
