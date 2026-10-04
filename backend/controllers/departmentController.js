import { DepartmentService } from '../services/departmentService.js';

export class DepartmentController {
  static getDepartments(req, res, next) {
    try {
      const departments = DepartmentService.getDepartments();
      res.json({
        success: true,
        departments,
      });
    } catch (err) {
      next(err);
    }
  }

  static getOfficers(req, res, next) {
    try {
      const { departmentId } = req.query;
      const officers = DepartmentService.getOfficers(departmentId);
      res.json({
        success: true,
        count: officers.length,
        officers,
      });
    } catch (err) {
      next(err);
    }
  }

  static getCategories(req, res, next) {
    try {
      const categories = DepartmentService.getCategories();
      res.json({
        success: true,
        categories,
      });
    } catch (err) {
      next(err);
    }
  }
}
