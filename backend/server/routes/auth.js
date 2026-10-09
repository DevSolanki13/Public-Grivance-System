import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { anonClient, clientForToken } from '../lib/supabase.js';
import { HttpError, unwrap } from '../lib/errors.js';
import { toProfile } from '../lib/mappers.js';
import { str } from '../lib/validate.js';

const router = Router();

// Slow down password guessing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_RATE_LIMIT) || 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { message: 'Too many login attempts. Please wait and try again.' } },
});

/**
 * POST /api/auth/login { email, password }
 * For API clients (Postman, scripts, mobile). Returns a Supabase access token
 * to send as "Authorization: Bearer <accessToken>". The web app signs in with
 * the Supabase client directly so it can refresh sessions automatically.
 */
router.post('/login', loginLimiter, async (req, res) => {
  const email = str(req.body, 'email', { required: true, max: 320 });
  const password = str(req.body, 'password', { required: true, max: 200 });

  const { data, error } = await anonClient.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new HttpError(401, 'Incorrect email or password.');

  const profile = unwrap(
    await clientForToken(data.session.access_token).from('profiles').select('*').eq('id', data.user.id).maybeSingle()
  );
  res.json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
    profile: toProfile(profile),
  });
});

export default router;
