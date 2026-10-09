import { clientForToken } from '../lib/supabase.js';
import { HttpError } from '../lib/errors.js';

// Requires "Authorization: Bearer <supabase access token>". Verifies the token
// with Supabase Auth, then attaches:
//   req.user — the authenticated user
//   req.db   — a Supabase client acting as that user (RLS enforced)
export async function requireAuth(req, _res, next) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new HttpError(401, 'Sign in required.');

  const db = clientForToken(match[1]);
  const { data, error } = await db.auth.getUser(match[1]);
  if (error || !data?.user) throw new HttpError(401, 'Your session has expired. Please sign in again.');

  req.user = data.user;
  req.db = db;
  next();
}
