/**
 * JanSewa Data Store Abstraction & Prisma Client Gateway
 * Connects seamlessly to Supabase PostgreSQL when DATABASE_URL is configured,
 * with fallback to local store during setup.
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

const isPrismaConfigured =
  Boolean(process.env.DATABASE_URL) &&
  !process.env.DATABASE_URL.includes('[YOUR-PASSWORD]') &&
  process.env.DATABASE_URL.startsWith('postgresql://');

let prisma = null;
if (isPrismaConfigured) {
  try {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
    if (typeof db.setPrismaClient === 'function') {
      db.setPrismaClient(prisma);
    }
  } catch (err) {
    console.warn('[Prisma] Initialization warning:', err.message);
  }
}

export { prisma, db, isPrismaConfigured };
export default prisma || db;
