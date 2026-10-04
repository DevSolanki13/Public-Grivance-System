import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jansewa_civic_jwt_secret_key_2026_super_secure';

export function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      departmentId: user.departmentId || null,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
