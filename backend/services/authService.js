import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { createToken } from '../utils/token.js';
import { HttpError } from '../middleware/errorHandler.js';

export class AuthService {
  static login(email, password, requestedRole) {
    if (!email || !password) {
      throw new HttpError(400, 'Email and password are required.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      throw new HttpError(401, 'Invalid email or password.');
    }

    if (requestedRole && user.role !== requestedRole && user.role !== 'admin') {
      throw new HttpError(401, `Account found, but role is '${user.role}', not '${requestedRole}'.`);
    }

    // Verify bcrypt password hash only
    const passwordMatch = user.password && bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      throw new HttpError(401, 'Invalid email or password.');
    }

    const token = createToken(user);
    const { password: _, rawPassword: __, ...userProfile } = user;

    return { token, user: userProfile };
  }

  static switchRole(targetRole) {
    if (process.env.NODE_ENV === 'production') {
      throw new HttpError(403, 'Role switching is disabled in production environment.');
    }

    const roleUsers = {
      citizen: 'user-citizen-1',
      officer: 'user-officer-elec',
      department_head: 'user-head-sanitation',
      admin: 'user-admin-1',
    };

    const targetUserId = roleUsers[targetRole];
    let user = targetUserId ? db.getUsers().find((u) => u.id === targetUserId) : null;

    if (!user) {
      user = db.getUsers().find((u) => u.role === targetRole);
    }

    if (!user) {
      throw new HttpError(404, `No demo account configured for role: ${targetRole}`);
    }

    const token = createToken(user);
    const { password: _, rawPassword: __, ...userProfile } = user;

    return { token, user: userProfile };
  }

  static getProfile(userId) {
    const user = db.getUsers().find((u) => u.id === userId);
    if (!user) {
      throw new HttpError(404, 'User not found.');
    }
    const { password: _, rawPassword: __, ...userProfile } = user;
    return userProfile;
  }

  static register(data) {
    const { name, email, phone, password, address } = data;

    if (!name || name.trim().length < 2) {
      throw new HttpError(400, 'Full name is required (minimum 2 characters).');
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      throw new HttpError(400, 'Please provide a valid email address.');
    }

    if (!password || password.length < 8) {
      throw new HttpError(400, 'Password must be at least 8 characters long.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new HttpError(409, 'An account with this email address already exists.');
    }

    const newUser = {
      id: `user-citizen-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      phone: (phone || '').trim(),
      password: bcrypt.hashSync(password, 10),
      role: 'citizen',
      address: (address || '').trim(),
      createdAt: new Date().toISOString(),
    };

    db.addUser(newUser);
    const token = createToken(newUser);
    const { password: _, rawPassword: __, ...userProfile } = newUser;

    return { token, user: userProfile };
  }
}
