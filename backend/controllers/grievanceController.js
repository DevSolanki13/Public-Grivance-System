import { GrievanceService } from '../services/grievanceService.js';

export class GrievanceController {
  static getAll(req, res, next) {
    try {
      const grievances = GrievanceService.getList(req.user, req.query);
      res.json({
        success: true,
        count: grievances.length,
        grievances,
      });
    } catch (err) {
      next(err);
    }
  }

  static getById(req, res, next) {
    try {
      const { id } = req.params;
      const grievance = GrievanceService.getById(id, req.user);
      res.json({
        success: true,
        grievance,
      });
    } catch (err) {
      next(err);
    }
  }

  static trackPublic(req, res, next) {
    try {
      const { complaintId } = req.params;
      const grievance = GrievanceService.trackPublic(complaintId);
      res.json({
        success: true,
        grievance,
      });
    } catch (err) {
      next(err);
    }
  }

  static create(req, res, next) {
    try {
      const grievance = GrievanceService.create(req.body, req.user, req.files || []);
      res.status(201).json({
        success: true,
        message: 'Grievance submitted successfully.',
        grievance,
      });
    } catch (err) {
      next(err);
    }
  }

  static updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, remark } = req.body;
      const updated = GrievanceService.updateStatus(id, status, remark, req.user);
      res.json({
        success: true,
        message: `Status updated to ${status}.`,
        grievance: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static assignOfficer(req, res, next) {
    try {
      const { id } = req.params;
      const { officerId, remark } = req.body;
      const updated = GrievanceService.assignOfficer(id, officerId, remark, req.user);
      res.json({
        success: true,
        message: 'Officer assigned successfully.',
        grievance: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static resolveWithProof(req, res, next) {
    try {
      const { id } = req.params;
      const updated = GrievanceService.resolveWithProof(id, req.body, req.files || [], req.user);
      res.json({
        success: true,
        message: 'Resolution proof submitted. Awaiting citizen verification.',
        grievance: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static verifyResolution(req, res, next) {
    try {
      const { id } = req.params;
      const updated = GrievanceService.verifyResolution(id, req.body, req.user);
      const isClosed = updated.status === 'CLOSED';
      res.json({
        success: true,
        message: isClosed
          ? 'Verification complete. Grievance closed successfully.'
          : 'Resolution rejected. Case reopened and escalated to department.',
        grievance: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static startWork(req, res, next) {
    try {
      const { id } = req.params;
      const { remark } = req.body;
      const updated = GrievanceService.updateStatus(id, 'IN_PROGRESS', remark || 'Officer commenced work on site.', req.user);
      res.json({
        success: true,
        message: 'Status changed to IN_PROGRESS.',
        grievance: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static reopen(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const updated = GrievanceService.verifyResolution(
        id,
        { satisfied: false, reopenReason: reason || 'Citizen requested case reopening.' },
        req.user
      );
      res.json({
        success: true,
        message: 'Grievance reopened and escalated.',
        grievance: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}
