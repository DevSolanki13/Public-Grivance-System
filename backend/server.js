import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import apiRouter from './routes/index.js';
import { db } from './db.js';
import { isPrismaConfigured } from './prisma.js';
import { evaluateAllGrievancesSLA } from './services/slaService.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/authMiddleware.js';
import { requireRole } from './middleware/roleMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Fail fast: never start a production server without a real signing secret.
if (process.env.NODE_ENV === 'production' && !(process.env.JWT_SECRET || '').trim()) {
  console.error('FATAL: JWT_SECRET is not set. Add it in Vercel -> Settings -> Environment Variables.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Behind Vercel's proxy the real client IP is in X-Forwarded-For. Without this,
// every visitor shares one IP and the login rate-limiter locks everyone out together.
app.set('trust proxy', 1);

// Strict CORS: only the origins listed in CORS_ORIGIN (comma separated) are allowed in production.
// Same-origin requests (frontend and API on one Vercel domain) send no CORS headers and are unaffected.
const ALLOWED_ORIGINS = CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        process.env.NODE_ENV !== 'production' ||
        ALLOWED_ORIGINS.includes('*') ||
        ALLOWED_ORIGINS.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(null, false); // browser blocks it; no 500 error page
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Request body size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve uploaded evidence & proof images statically with anti-MIME-sniffing headers
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  },
  express.static(UPLOADS_DIR)
);

// System Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'JanSewa Public Grievance API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Protected Database Reset endpoint (Requires Admin role; disabled in production)
app.post('/api/reset-data', authenticate, requireRole('admin'), (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Database reset is strictly prohibited in production environment.',
    });
  }
  db.reset();
  res.json({ success: true, message: 'JanSewa database reset to default realistic seed records.' });
});

// Central API Routes
app.use('/api', apiRouter);

// Central Error Handling Middleware
app.use(errorHandler);

// Periodic background SLA evaluator (checks every 2 minutes for overdue grievances)
const slaInterval = setInterval(() => {
  const updated = evaluateAllGrievancesSLA(db.getGrievances());
  if (updated > 0) {
    db.save();
    console.log(`[SLA Worker] Evaluated deadlines: ${updated} grievance(s) marked overdue/escalated.`);
  }
}, 120 * 1000);
if (slaInterval && typeof slaInterval.unref === 'function') {
  slaInterval.unref();
}

// Graceful shutdown handling
const cleanup = () => {
  clearInterval(slaInterval);
  process.exit(0);
};
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🏛️  JanSewa Public Grievance Backend API Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🛡️  CORS Origin: ${CORS_ORIGIN}`);
  console.log(`📁 Uploads Dir: ${UPLOADS_DIR}`);
  console.log(`🐘 Database: Embedded JSON store`);
  console.log(`======================================================\n`);
});

export { app, server, slaInterval };
export default app;
