import jwt from 'jsonwebtoken';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '' || secret === 'change-me-to-a-secure-random-secret-at-least-32-chars') {
    if (process.env.NODE_ENV === 'production') {
      // Never fall back to a secret that is visible in the source code in production.
      throw new Error('FATAL: JWT_SECRET environment variable must be set in production.');
    }
    return 'jansewa_dev_fallback_secret_key_random_long_2026';
  }
  return secret;
}

export function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      departmentId: user.departmentId || null,
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (err) {
    return null;
  }
}
