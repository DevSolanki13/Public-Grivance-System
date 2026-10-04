import { AuthService } from '../services/authService.js';

export class AuthController {
  static login(req, res, next) {
    try {
      const { email, password, role } = req.body;
      const result = AuthService.login(email, password, role);
      res.json({
        success: true,
        message: 'Login successful.',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  static switchRole(req, res, next) {
    try {
      const { role } = req.body;
      const result = AuthService.switchRole(role);
      res.json({
        success: true,
        message: `Switched active role to '${role}'.`,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  static getMe(req, res, next) {
    try {
      const profile = AuthService.getProfile(req.user.id);
      res.json({
        success: true,
        user: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  static register(req, res, next) {
    try {
      const result = AuthService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'Citizen account registered successfully.',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
}
