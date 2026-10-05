import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../data/db.json');

try {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✓ Removed existing backend/data/db.json');
  }
  console.log('✓ Database ready to initialize with fresh seed data.');
} catch (err) {
  console.error('Failed to reset database file:', err.message);
}
