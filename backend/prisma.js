/**
 * JanSewa Data Store Abstraction
 * Central persistence gateway for domain operations.
 * Isolates data operations so persistence engine can be migrated to Prisma / PostgreSQL seamlessly.
 */
import { db } from './db.js';

export { db };
export default db;
