import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { createToken } from '../utils/token.js';

export class AuthService {
  static login(email, password, requestedRole) {
    if (!email || !password) {
      const err = new Error('Email and password are required.');
      err.status = 400;
      throw err;
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    if (requestedRole && user.role !== requestedRole && user.role !== 'admin') {
      const err = new Error(`Account found, but role is '${user.role}', not '${requestedRole}'. Please switch role selector.`);
      err.status = 401;
      throw err;
    }

    const passwordMatch =
      password === user.rawPassword ||
      (user.password && bcrypt.compareSync(password, user.password));

    if (!passwordMatch) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    const token = createToken(user);
    const { password: _, rawPassword: __, ...userProfile } = user;

    return { token, user: userProfile };
  }

  static switchRole(targetRole) {
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
      const err = new Error(`No mock account found for role: ${targetRole}`);
      err.status = 404;
      throw err;
    }

    const token = createToken(user);
    const { password: _, rawPassword: __, ...userProfile } = user;

    return { token, user: userProfile };
  }

  static getProfile(userId) {
    const user = db.getUsers().find((u) => u.id === userId);
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }
    const { password: _, rawPassword: __, ...userProfile } = user;
    return userProfile;
  }

  static register(data) {
    const { name, email, phone, password, address } = data;
    if (!name || !email || !password) {
      const err = new Error('Name, email, and password are required.');
      err.status = 400;
      throw err;
    }

    const existing = db.getUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      const err = new Error('An account with this email address already exists.');
      err.status = 409;
      throw err;
    }

    const newUser = {
      id: `user-citizen-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || '',
      password: bcrypt.hashSync(password, 10),
      rawPassword: password,
      role: 'citizen',
      address: address || '',
      createdAt: new Date().toISOString(),
    };

    db.addUser(newUser);
    const token = createToken(newUser);
    const { password: _, rawPassword: __, ...userProfile } = newUser;

    return { token, user: userProfile };
  }
}
