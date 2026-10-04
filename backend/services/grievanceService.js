import { db } from '../db.js';
import { calculateSLADeadline, computeSLAStatus } from './slaService.js';
import { canRoleTransition, isValidTransition } from './stateMachine.js';
import { NotificationService } from './notificationService.js';
import { generateComplaintId, generateAuditLogId } from '../utils/helpers.js';
import { DEFAULT_SLA_HOURS } from '../constants/index.js';

export class GrievanceService {
  static getList(user, filters = {}) {
    let list = [...db.getGrievances()];

    // 1. Role-aware scoping with full cross-role visibility
    const { status, priority, departmentId, search, isOverdue, isEscalated, scope } = filters;

    if (user.role === 'citizen' && scope === 'my') {
      list = list.filter((g) => g.citizenId === user.id);
    } else if (user.role === 'officer' && scope === 'assigned') {
      list = list.filter((g) => g.assignedOfficerId === user.id);
    } else if (user.role === 'department_head' && departmentId && departmentId !== 'All') {
      list = list.filter((g) => g.departmentId === departmentId);
    }

    // 2. Query filters
    if (status && status !== 'All') {
      list = list.filter((g) => g.status === status);
    }
    if (priority && priority !== 'All') {
      list = list.filter((g) => (g.priority || '').toUpperCase() === priority.toUpperCase());
    }
    if (departmentId && departmentId !== 'All') {
      list = list.filter((g) => g.departmentId === departmentId);
    }
    if (isOverdue === 'true') {
      list = list.filter((g) => computeSLAStatus(g).isOverdue);
    }
    if (isEscalated === 'true') {
      list = list.filter((g) => g.isEscalated);
    }
    if (search) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (g) =>
          g.complaintId.toLowerCase().includes(q) ||
          g.subject.toLowerCase().includes(q) ||
          (g.citizenName || '').toLowerCase().includes(q) ||
          (g.location?.area || '').toLowerCase().includes(q) ||
          (g.department || '').toLowerCase().includes(q)
      );
    }

    // 3. Attach computed SLA state & sort newest first
    const enriched = list.map((g) => ({
      ...g,
      slaInfo: computeSLAStatus(g),
    }));

    enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return enriched;
  }

  static getById(id, user) {
    const g = db.getGrievances().find((item) => item.id === id || item.complaintId === id);
    if (!g) {
      const err = new Error('Grievance not found.');
      err.status = 404;
      throw err;
    }

    // All authenticated civic users (citizens, officers, dept heads, admin) can inspect grievance details
    return {
      ...g,
      slaInfo: computeSLAStatus(g),
    };
  }

  static trackPublic(complaintId) {
    if (!complaintId) {
      const err = new Error('Complaint ID is required.');
      err.status = 400;
      throw err;
    }

    const cleanId = complaintId.trim().toUpperCase();
    const g = db.getGrievances().find((item) => item.complaintId.toUpperCase() === cleanId);

    if (!g) {
      const err = new Error(`No grievance found with tracking number '${complaintId}'.`);
      err.status = 404;
      throw err;
    }

    // Return sanitized public tracking representation
    return {
      id: g.id,
      complaintId: g.complaintId,
      subject: g.subject,
      category: g.category,
      department: g.department,
      status: g.status,
      priority: g.priority,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      slaDeadline: g.slaDeadline,
      slaInfo: computeSLAStatus(g),
      location: {
        area: g.location?.area || 'Ward Area',
        pincode: g.location?.pincode || '',
      },
      timeline: g.timeline,
      resolution: g.resolution ? {
        text: g.resolution.text,
        resolvedAt: g.resolution.resolvedAt,
        proofUrls: g.resolution.proofUrls || [],
      } : null,
      verification: g.verification || null,
    };
  }

  static create(data, user, files = []) {
    const {
      categoryId,
      subcategoryId,
      subcategory,
      subject,
      description,
      priority = 'Medium',
      address,
      area,
      pincode,
      latitude,
      longitude,
    } = data;

    if (!categoryId || !subject || !description) {
      const err = new Error('Category, subject, and description are required.');
      err.status = 400;
      throw err;
    }

    const category = db.getCategories().find((c) => c.id === categoryId);
    const department = category
      ? db.getDepartments().find((d) => d.id === category.departmentId)
      : null;

    const slaHours = category?.slaHours || DEFAULT_SLA_HOURS[priority.toUpperCase()] || 48;
    const sla = calculateSLADeadline(slaHours);
    const complaintId = generateComplaintId();

    const evidenceUrls = files.map((f) => `/uploads/${f.filename}`);

    const newGrievance = {
      id: `grv-${Date.now()}`,
      complaintId,
      citizenId: user.id,
      citizenName: user.name,
      citizenEmail: user.email,
      citizenPhone: user.phone || '',
      categoryId,
      category: category ? category.name : 'Civic Issue',
      subcategoryId: subcategoryId || 'general',
      subcategory: subcategory || 'General Civic Concern',
      subject: subject.trim(),
      description: description.trim(),
      location: {
        address: address || 'Not specified',
        area: area || 'Ward Central',
        pincode: pincode || '400001',
        latitude: latitude ? parseFloat(latitude) : 19.076,
        longitude: longitude ? parseFloat(longitude) : 72.8777,
      },
      priority: priority.toUpperCase(),
      status: 'SUBMITTED',
      departmentId: department ? department.id : 'dept-roads',
      department: department ? department.name : 'Roads & Infrastructure',
      assignedOfficerId: null,
      assignedOfficerName: null,
      assignedAt: null,
      slaHours,
      slaStartedAt: sla.slaStartedAt,
      slaDeadline: sla.slaDeadline,
      isOverdue: false,
      isEscalated: false,
      adminRemark: null,
      evidence: evidenceUrls,
      resolution: null,
      verification: null,
      feedback: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          status: 'SUBMITTED',
          title: 'Grievance Registered',
          description: `Grievance registered with ${priority} priority. SLA Target: ${slaHours} Hours.`,
          performedBy: user.name,
          performedByRole: 'citizen',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    db.addGrievance(newGrievance);

    // Dispatch in-app notification to citizen
    NotificationService.createNotification({
      userId: user.id,
      title: 'Grievance Submitted',
      message: `Your grievance ${complaintId} has been successfully logged with ${priority} priority.`,
      type: 'success',
      grievanceId: newGrievance.id,
    });

    // Notify Department Head
    if (department?.headOfficerId) {
      NotificationService.createNotification({
        userId: department.headOfficerId,
        title: 'New Department Grievance',
        message: `New complaint ${complaintId} submitted under ${category?.name}. Needs assignment.`,
        type: 'info',
        grievanceId: newGrievance.id,
      });
    }

    db.addAuditLog({
      action: 'GRIEVANCE_CREATED',
      grievanceId: newGrievance.id,
      complaintId,
      performedBy: user.name,
      performedByRole: user.role,
      details: `Created grievance: ${subject} (${priority})`,
    });

    return {
      ...newGrievance,
      slaInfo: computeSLAStatus(newGrievance),
    };
  }

  static updateStatus(id, newStatus, remark, user) {
    const g = db.getGrievances().find((item) => item.id === id || item.complaintId === id);
    if (!g) {
      const err = new Error('Grievance not found.');
      err.status = 404;
      throw err;
    }

    const isAssignee = g.assignedOfficerId === user.id;
    const isCreator = g.citizenId === user.id;

    if (!canRoleTransition(user.role, g.status, newStatus, isAssignee, isCreator)) {
      const err = new Error(`Role '${user.role}' is not authorized to transition from '${g.status}' to '${newStatus}'.`);
      err.status = 403;
      throw err;
    }

    if (!isValidTransition(g.status, newStatus)) {
      const err = new Error(`Invalid transition from '${g.status}' to '${newStatus}'.`);
      err.status = 400;
      throw err;
    }

    const previousStatus = g.status;
    const updates = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      adminRemark: remark || g.adminRemark,
    };

    const timelineEntry = {
      id: `tl-${Date.now()}`,
      status: newStatus,
      title: `Status Changed to ${newStatus.replace(/_/g, ' ')}`,
      description: remark || `Status updated from ${previousStatus} to ${newStatus}`,
      performedBy: user.name,
      performedByRole: user.role,
      timestamp: new Date().toISOString(),
    };

    updates.timeline = [...g.timeline, timelineEntry];
    const updated = db.updateGrievance(g.id, updates);

    // Notify citizen of progress
    NotificationService.createNotification({
      userId: g.citizenId,
      title: `Status Update: ${g.complaintId}`,
      message: `Your grievance is now '${newStatus.replace(/_/g, ' ')}'. ${remark ? `Note: ${remark}` : ''}`,
      type: 'info',
      grievanceId: g.id,
    });

    db.addAuditLog({
      action: 'STATUS_UPDATED',
      grievanceId: g.id,
      complaintId: g.complaintId,
      performedBy: user.name,
      performedByRole: user.role,
      details: `Status changed from ${previousStatus} to ${newStatus}. Remark: ${remark || 'None'}`,
    });

    return {
      ...updated,
      slaInfo: computeSLAStatus(updated),
    };
  }

  static assignOfficer(id, officerId, remark, user) {
    const g = db.getGrievances().find((item) => item.id === id || item.complaintId === id);
    if (!g) {
      const err = new Error('Grievance not found.');
      err.status = 404;
      throw err;
    }

    const officer = db.getUsers().find((u) => u.id === officerId && u.role === 'officer');
    if (!officer) {
      const err = new Error('Assigned officer not found.');
      err.status = 404;
      throw err;
    }

    const updates = {
      assignedOfficerId: officer.id,
      assignedOfficerName: officer.name,
      assignedAt: new Date().toISOString(),
      status: 'ASSIGNED',
      adminRemark: remark || `Assigned to field officer ${officer.name}`,
      updatedAt: new Date().toISOString(),
    };

    const timelineEntry = {
      id: `tl-${Date.now()}`,
      status: 'ASSIGNED',
      title: 'Officer Assigned',
      description: `Task assigned to ${officer.name} (${officer.designation || 'Field Officer'}). ${remark || ''}`,
      performedBy: user.name,
      performedByRole: user.role,
      timestamp: new Date().toISOString(),
    };

    updates.timeline = [...g.timeline, timelineEntry];
    const updated = db.updateGrievance(g.id, updates);

    // Notify Officer
    NotificationService.createNotification({
      userId: officer.id,
      title: 'New Case Assigned',
      message: `You have been assigned grievance ${g.complaintId}: ${g.subject}.`,
      type: 'warning',
      grievanceId: g.id,
    });

    // Notify Citizen
    NotificationService.createNotification({
      userId: g.citizenId,
      title: 'Officer Assigned to Your Case',
      message: `Officer ${officer.name} has been assigned to inspect and resolve ${g.complaintId}.`,
      type: 'info',
      grievanceId: g.id,
    });

    db.addAuditLog({
      action: 'OFFICER_ASSIGNED',
      grievanceId: g.id,
      complaintId: g.complaintId,
      performedBy: user.name,
      performedByRole: user.role,
      details: `Assigned to officer ${officer.name} (${officer.id})`,
    });

    return {
      ...updated,
      slaInfo: computeSLAStatus(updated),
    };
  }

  static resolveWithProof(id, data, files, user) {
    const g = db.getGrievances().find((item) => item.id === id || item.complaintId === id);
    if (!g) {
      const err = new Error('Grievance not found.');
      err.status = 404;
      throw err;
    }

    const summary = (data.resolutionSummary || data.description || '').trim();
    if (!summary) {
      const err = new Error('Resolution summary or description is required.');
      err.status = 400;
      throw err;
    }

    const proofUrls = (files || []).map((f) => `/uploads/${f.filename}`);

    const resolutionData = {
      resolvedBy: user.name,
      resolvedById: user.id,
      resolvedAt: new Date().toISOString(),
      summary,
      remarks: data.remarks || '',
      proofFiles: proofUrls,
    };

    const updates = {
      status: 'AWAITING_VERIFICATION',
      resolution: resolutionData,
      updatedAt: new Date().toISOString(),
    };

    const timelineEntry = {
      id: `tl-${Date.now()}`,
      status: 'AWAITING_VERIFICATION',
      title: 'Resolution Submitted - Verification Required',
      description: `Field officer ${user.name} submitted resolution proof. Awaiting citizen confirmation.`,
      performedBy: user.name,
      performedByRole: user.role,
      timestamp: new Date().toISOString(),
    };

    updates.timeline = [...g.timeline, timelineEntry];
    const updated = db.updateGrievance(g.id, updates);

    // Notify citizen to verify resolution
    NotificationService.createNotification({
      userId: g.citizenId,
      title: 'Action Needed: Verify Resolution',
      message: `Resolution proof has been submitted for ${g.complaintId}. Please inspect and confirm satisfaction.`,
      type: 'success',
      grievanceId: g.id,
    });

    db.addAuditLog({
      action: 'RESOLUTION_SUBMITTED',
      grievanceId: g.id,
      complaintId: g.complaintId,
      performedBy: user.name,
      performedByRole: user.role,
      details: `Submitted resolution with ${proofUrls.length} proof photos.`,
    });

    return {
      ...updated,
      slaInfo: computeSLAStatus(updated),
    };
  }

  static verifyResolution(id, data, user) {
    const g = db.getGrievances().find((item) => item.id === id || item.complaintId === id);
    if (!g) {
      const err = new Error('Grievance not found.');
      err.status = 404;
      throw err;
    }

    if (user.role !== 'citizen' && user.role !== 'admin') {
      const err = new Error('Only citizens or administrators can verify or reopen resolutions.');
      err.status = 403;
      throw err;
    }

    const { satisfied, feedback, rating = 5, reopenReason } = data;

    if (satisfied) {
      // Citizen accepted resolution -> CLOSED
      const updates = {
        status: 'CLOSED',
        closedAt: new Date().toISOString(),
        verification: {
          verifiedBy: user.name,
          verifiedAt: new Date().toISOString(),
          satisfied: true,
          rating: Number(rating),
          feedback: feedback || 'Satisfied with resolution.',
        },
        updatedAt: new Date().toISOString(),
      };

      const timelineEntry = {
        id: `tl-${Date.now()}`,
        status: 'CLOSED',
        title: 'Citizen Verified & Closed',
        description: `Citizen verified the work: Satisfied (Rating: ${rating}/5). "${feedback || 'No comments'}"`,
        performedBy: user.name,
        performedByRole: 'citizen',
        timestamp: new Date().toISOString(),
      };

      updates.timeline = [...g.timeline, timelineEntry];
      const updated = db.updateGrievance(g.id, updates);

      // Notify officer
      if (g.assignedOfficerId) {
        NotificationService.createNotification({
          userId: g.assignedOfficerId,
          title: `Grievance Closed (${rating}★)`,
          message: `Citizen confirmed satisfaction for ${g.complaintId}. Rated ${rating}/5.`,
          type: 'success',
          grievanceId: g.id,
        });
      }

      db.addAuditLog({
        action: 'CITIZEN_VERIFIED_CLOSED',
        grievanceId: g.id,
        complaintId: g.complaintId,
        performedBy: user.name,
        performedByRole: 'citizen',
        details: `Closed with ${rating} star rating. Feedback: ${feedback || 'None'}`,
      });

      return {
        ...updated,
        slaInfo: computeSLAStatus(updated),
      };
    } else {
      // Citizen rejected resolution -> REOPENED & ESCALATED
      if (!reopenReason) {
        const err = new Error('A detailed reason is required when rejecting resolution and reopening a case.');
        err.status = 400;
        throw err;
      }

      const updates = {
        status: 'REOPENED',
        isEscalated: true,
        escalationReason: `Citizen rejected resolution: ${reopenReason}`,
        verification: {
          verifiedBy: user.name,
          verifiedAt: new Date().toISOString(),
          satisfied: false,
          reopenReason,
        },
        updatedAt: new Date().toISOString(),
      };

      const timelineEntry = {
        id: `tl-${Date.now()}`,
        status: 'REOPENED',
        title: 'Resolution Rejected - Grievance Reopened',
        description: `Citizen not satisfied. Case reopened & escalated: "${reopenReason}"`,
        performedBy: user.name,
        performedByRole: 'citizen',
        timestamp: new Date().toISOString(),
      };

      updates.timeline = [...g.timeline, timelineEntry];
      const updated = db.updateGrievance(g.id, updates);

      // Notify officer and Department Head
      if (g.assignedOfficerId) {
        NotificationService.createNotification({
          userId: g.assignedOfficerId,
          title: `⚠️ Case Reopened: ${g.complaintId}`,
          message: `Citizen rejected resolution. Reason: ${reopenReason}`,
          type: 'error',
          grievanceId: g.id,
        });
      }

      const dept = db.getDepartments().find((d) => d.id === g.departmentId);
      if (dept?.headOfficerId) {
        NotificationService.createNotification({
          userId: dept.headOfficerId,
          title: `Escalation: Case Reopened ${g.complaintId}`,
          message: `Citizen rejected resolution for ${g.complaintId}. Work requires reinspection.`,
          type: 'warning',
          grievanceId: g.id,
        });
      }

      db.addAuditLog({
        action: 'CITIZEN_REOPENED',
        grievanceId: g.id,
        complaintId: g.complaintId,
        performedBy: user.name,
        performedByRole: 'citizen',
        details: `Reopened with reason: ${reopenReason}`,
      });

      return {
        ...updated,
        slaInfo: computeSLAStatus(updated),
      };
    }
  }
}
