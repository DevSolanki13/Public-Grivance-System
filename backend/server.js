import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import apiRouter from './routes/index.js';
import { db } from './db.js';
import { evaluateAllGrievancesSLA } from './services/slaService.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite client
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded evidence & proof images statically
app.use('/uploads', express.static(UPLOADS_DIR));

// System Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'JanSewa Public Grievance API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Reset data endpoint (for testing/demo purposes)
app.post('/api/reset-data', (req, res) => {
  db.reset();
  res.json({ success: true, message: 'JanSewa database reset to default realistic seed records.' });
});

// Mount Central API Routes
app.use('/api', apiRouter);

// Central Error Handling Middleware
app.use(errorHandler);

// Periodic background SLA evaluator (checks every 2 minutes for overdue grievances)
setInterval(() => {
  const updated = evaluateAllGrievancesSLA(db.getGrievances());
  if (updated > 0) {
    db.save();
    console.log(`[SLA Worker] Evaluated deadlines: ${updated} grievance(s) marked overdue/escalated.`);
  }
}, 120 * 1000);

// Start server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🏛️  JanSewa Public Grievance Backend API Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📁 Uploads Dir: ${UPLOADS_DIR}`);
  console.log(`======================================================\n`);
});

export default app;
