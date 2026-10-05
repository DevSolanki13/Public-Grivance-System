import { db } from '../db.js';
import { calculateSLADeadline, computeSLAStatus } from './slaService.js';
import { canRoleTransition, isValidTransition } from './stateMachine.js';
import { NotificationService } from './notificationService.js';
import { generateComplaintId } from '../utils/helpers.js';
import { DEFAULT_SLA_HOURS, PRIORITIES } from '../constants/index.js';
import { HttpError } from '../middleware/errorHandler.js';

export class GrievanceService {
  /**
   * Helper to retrieve a grievance by ID or throw 404
   */
  static findOrThrow(id) {
    const g = db.getGrievances().find((item) => item.id === id || item.complaintId === id);
    if (!g) {
      throw new HttpError(404, `Grievance '${id}' not found.`);
    }
    return g;
  }

  /**
   * Access control check: verifies if a user has permission to view a specific grievance
   */
  static assertCanView(user, grievance) {
    if (!user) throw new HttpError(401, 'Authentication required.');
    if (user.role === 'admin') return true;

    if (user.role === 'citizen') {
      if (grievance.citizenId !== user.id) {
        throw new HttpError(403, 'Forbidden: You are only authorized to view your own grievances.');
      }
      return true;
    }

    if (user.role === 'department_head') {
      if (grievance.departmentId !== user.departmentId) {
        throw new HttpError(403, 'Forbidden: You can only view grievances assigned to your department.');
      }
      return true;
    }

    if (user.role === 'officer') {
      if (grievance.assignedOfficerId !== user.id && grievance.departmentId !== user.departmentId) {
        throw new HttpError(403, 'Forbidden: You can only access grievances within your department or assigned queue.');
      }
      return true;
    }

    throw new HttpError(403, 'Forbidden: Insufficient privileges.');
  }

  /**
   * Scoped and filtered list of grievances based on caller role
   */
  static getList(user, filters = {}) {
    let list = [...db.getGrievances()];
    const { status, priority, departmentId, search, isOverdue, isEscalated, scope } = filters;

    // 1. Strict Server-Side Role Isolation
    if (user.role === 'citizen') {
      // Citizens must NEVER receive other citizens' private grievances
      list = list.filter((g) => g.citizenId === user.id);
    } else if (user.role === 'officer') {
      if (scope === 'assigned') {
        list = list.filter((g) => g.assignedOfficerId === user.id);
      } else {
        list = list.filter((g) => g.assignedOfficerId === user.id || g.departmentId === user.departmentId);
      }
    } else if (user.role === 'department_head') {
      list = list.filter((g) => g.departmentId === user.departmentId);
    }

    // 2. Query parameter filters
    if (status && status !== 'All') {
      list = list.filter((g) => g.status === status);
    }
    if (priority && priority !== 'All') {
      const p = String(priority).toUpperCase();
      list = list.filter((g) => (g.priority || '').toUpperCase() === p);
    }
    if (departmentId && departmentId !== 'All' && user.role === 'admin') {
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
          (g.complaintId || '').toLowerCase().includes(q) ||
          (g.subject || '').toLowerCase().includes(q) ||
          (g.citizenName || '').toLowerCase().includes(q) ||
          (g.location?.area || '').toLowerCase().includes(q) ||
          (g.department || '').toLowerCase().includes(q)
      );
    }

    // 3. Attach computed SLA information & sort newest first
    const enriched = list.map((g) => ({
      ...g,
      slaInfo: computeSLAStatus(g),
    }));

    enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return enriched;
  }

  static getById(id, user) {
    const g = this.findOrThrow(id);
    this.assertCanView(user, g);

    return {
      ...g,
      slaInfo: computeSLAStatus(g),
    };
  }

  /**
   * Public tracking endpoint (Privacy-safe: masks personal contacts and full names)
   */
  static trackPublic(complaintId) {
    if (!complaintId) {
      throw new HttpError(400, 'Complaint tracking ID is required.');
    }

    const cleanId = complaintId.trim().toUpperCase();
    const g = db.getGrievances().find((item) => item.complaintId.toUpperCase() === cleanId);

    if (!g) {
      throw new HttpError(404, `No grievance found with tracking number '${complaintId}'.`);
    }

    // Sanitize timeline to prevent exposing officer or citizen phone numbers / full personal info publicly
    const sanitizedTimeline = (g.timeline || []).map((tl) => ({
      id: tl.id,
      status: tl.status,
      title: tl.title,
      description: tl.description,
      performedByRole: tl.performedByRole || 'system',
      timestamp: tl.timestamp,
    }));

    const resolutionText = g.resolution?.text || g.resolution?.summary || g.resolution?.description || '';
    const proofList = g.resolution?.proofUrls || g.resolution?.proofFiles || [];

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
      timeline: sanitizedTimeline,
      resolution: g.resolution
        ? {
            text: resolutionText,
            summary: resolutionText,
            resolvedAt: g.resolution.resolvedAt,
            proofUrls: proofList,
            proofFiles: proofList,
          }
        : null,
      verification: g.verification
        ? {
            satisfied: g.verification.satisfied,
            rating: g.verification.rating,
            feedback: g.verification.feedback || g.verification.citizenRemarks,
            verifiedAt: g.verification.verifiedAt,
          }
        : null,
    };
  }

  static create(data, user, files = []) {
    const {
      categoryId,
      subcategoryId,
      subcategory,
      subject,
      description,
      priority = 'MEDIUM',
      address,
      area,
      pincode,
      latitude,
      longitude,
    } = data;

    if (!categoryId) {
      throw new HttpError(400, 'Category selection is required.');
    }

    if (!subject || subject.trim().length < 5 || subject.trim().length > 150) {
      throw new HttpError(400, 'Subject is required and must be between 5 and 150 characters.');
    }

    if (!description || description.trim().length < 10 || description.trim().length > 2000) {
      throw new HttpError(400, 'Description is required and must be between 10 and 2000 characters.');
    }

    // Validate priority
    const cleanPriority = String(priority).toUpperCase();
    const validPriority = PRIORITIES.includes(cleanPriority) ? cleanPriority : 'MEDIUM';

    const cleanCat = String(categoryId || '').trim().toLowerCase();
    let category = db.getCategories().find(
      (c) =>
        c.id.toLowerCase() === cleanCat ||
        c.name.toLowerCase() === cleanCat ||
        c.departmentId.toLowerCase() === cleanCat
    );

    if (!category) {
      const dept = db.getDepartments().find(
        (d) =>
          d.id.toLowerCase() === cleanCat ||
          d.name.toLowerCase() === cleanCat ||
          d.name.toLowerCase().includes(cleanCat) ||
          cleanCat.includes(d.name.toLowerCase())
      );
      if (dept) {
        category = db.getCategories().find((c) => c.departmentId === dept.id);
      }
    }

    if (!category) {
      category = db.getCategories()[0];
    }

    const department = db.getDepartments().find((d) => d.id === category.departmentId);

    // Compute SLA based on priority urgency and category baseline
    let slaHours = DEFAULT_SLA_HOURS[validPriority] || category.slaHours || 48;
    if (category.slaHours && validPriority !== 'CRITICAL' && validPriority !== 'URGENT') {
      slaHours = category.slaHours;
    }

    const sla = calculateSLADeadline(slaHours);
    const complaintId = generateComplaintId(db.getGrievances());
    const evidenceUrls = (files || []).map((f) => `/uploads/${f.filename}`);

    const latVal = parseFloat(latitude);
    const lngVal = parseFloat(longitude);

    const newGrievance = {
      id: `grv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      complaintId,
      citizenId: user.id,
      citizenName: user.name,
      citizenEmail: user.email,
      citizenPhone: user.phone || '',
      categoryId: category.id,
      category: category.name,
      subcategoryId: subcategoryId || 'general',
      subcategory: subcategory || category.name,
      subject: subject.trim(),
      description: description.trim(),
      location: {
        address: (address || 'Not specified').trim(),
        area: (area || 'Ward Central').trim(),
        pincode: (pincode || '401101').trim(),
        latitude: !isNaN(latVal) ? latVal : 19.3012,
        longitude: !isNaN(lngVal) ? lngVal : 72.8519,
      },
      priority: validPriority,
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
          description: `Grievance registered with ${validPriority} priority. SLA Target: ${slaHours} Hours.`,
          performedBy: user.name,
          performedByRole: 'citizen',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    db.addGrievance(newGrievance);

    // In-app notification to citizen
    NotificationService.createNotification({
      userId: user.id,
      title: 'Grievance Submitted',
      message: `Your grievance ${complaintId} has been successfully logged with ${validPriority} priority.`,
      type: 'success',
      grievanceId: newGrievance.id,
    });

    // In-app notification to department head
    if (department?.headOfficerId) {
      NotificationService.createNotification({
        userId: department.headOfficerId,
        title: 'New Department Grievance',
        message: `New complaint ${complaintId} logged under ${category.name}. Assignment required.`,
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
      details: `Created grievance: ${subject.trim()} (${validPriority})`,
    });

    return {
      ...newGrievance,
      slaInfo: computeSLAStatus(newGrievance),
    };
  }

  static updateStatus(id, newStatus, remark, user) {
    const g = this.findOrThrow(id);

    if (g.status === newStatus) {
      throw new HttpError(400, `Grievance is already in status '${newStatus}'.`);
    }

    const isAssignee = g.assignedOfficerId === user.id;
    const isCreator = g.citizenId === user.id;

    if (!canRoleTransition(user.role, g.status, newStatus, isAssignee, isCreator)) {
      throw new HttpError(403, `Role '${user.role}' is not authorized to transition from '${g.status}' to '${newStatus}'.`);
    }

    if (!isValidTransition(g.status, newStatus)) {
      throw new HttpError(400, `Invalid state machine transition from '${g.status}' to '${newStatus}'.`);
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

    updates.timeline = [...(g.timeline || []), timelineEntry];
    const updated = db.updateGrievance(g.id, updates);

    // Notify citizen
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
      previousStatus,
      newStatus,
      details: `Status changed from ${previousStatus} to ${newStatus}. Remark: ${remark || 'None'}`,
    });

    return {
      ...updated,
      slaInfo: computeSLAStatus(updated),
    };
  }

  static assignOfficer(id, officerId, remark, user) {
    const g = this.findOrThrow(id);

    // Department Head IDOR check: can only assign cases for their own department
    if (user.role === 'department_head' && user.departmentId !== g.departmentId) {
      throw new HttpError(403, 'Forbidden: Department heads can only assign cases in their own department.');
    }

    const officer = db.getUsers().find((u) => u.id === officerId && u.role === 'officer');
    if (!officer) {
      throw new HttpError(404, 'Assigned field officer not found.');
    }

    // Verify officer belongs to the same department as the grievance
    if (officer.departmentId !== g.departmentId) {
      throw new HttpError(400, `Officer '${officer.name}' belongs to department '${officer.departmentId}', not '${g.departmentId}'.`);
    }

    if (!['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'REOPENED'].includes(g.status)) {
      throw new HttpError(400, `Cannot reassign officer when grievance is in status '${g.status}'.`);
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

    updates.timeline = [...(g.timeline || []), timelineEntry];
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
    const g = this.findOrThrow(id);

    // Enforce that only the assigned officer or an administrator can submit resolution
    if (user.role !== 'admin' && g.assignedOfficerId !== user.id) {
      throw new HttpError(403, 'Forbidden: Only the assigned field officer can submit resolution proof.');
    }

    if (!['IN_PROGRESS', 'REOPENED', 'ASSIGNED'].includes(g.status)) {
      throw new HttpError(400, `Cannot submit resolution for a grievance in status '${g.status}'.`);
    }

    const summary = (data.resolutionSummary || data.description || '').trim();
    if (!summary || summary.length < 10) {
      throw new HttpError(400, 'A detailed resolution summary (minimum 10 characters) is required.');
    }

    const proofUrls = (files || []).map((f) => `/uploads/${f.filename}`);
    if (proofUrls.length === 0 && (!g.resolution || !g.resolution.proofFiles?.length)) {
      throw new HttpError(400, 'At least one resolution proof photograph is required.');
    }

    const combinedProof = [...(proofUrls.length ? proofUrls : (g.resolution?.proofFiles || []))];

    const resolutionData = {
      resolvedBy: user.name,
      resolvedById: user.id,
      resolvedAt: new Date().toISOString(),
      summary,
      text: summary,
      remarks: data.remarks || '',
      proofFiles: combinedProof,
      proofUrls: combinedProof,
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

    updates.timeline = [...(g.timeline || []), timelineEntry];
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
      details: `Submitted resolution with ${combinedProof.length} proof photos.`,
    });

    return {
      ...updated,
      slaInfo: computeSLAStatus(updated),
    };
  }

  static verifyResolution(id, data, user) {
    const g = this.findOrThrow(id);

    // IDOR protection: only the citizen who filed the grievance (or admin) can verify/reopen
    if (user.role !== 'admin' && g.citizenId !== user.id) {
      throw new HttpError(403, 'Forbidden: You can only verify or reopen your own grievance.');
    }

    const { satisfied, feedback, rating = 5, reopenReason } = data;

    if (satisfied) {
      // Must be in verification stage
      if (!['AWAITING_VERIFICATION', 'RESOLUTION_SUBMITTED'].includes(g.status)) {
        throw new HttpError(400, `Cannot close grievance: status is '${g.status}', not awaiting verification.`);
      }

      const numRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));

      const updates = {
        status: 'CLOSED',
        closedAt: new Date().toISOString(),
        verification: {
          verifiedBy: user.name,
          verifiedAt: new Date().toISOString(),
          satisfied: true,
          rating: numRating,
          feedback: feedback || 'Satisfied with resolution.',
          citizenRemarks: feedback || 'Satisfied with resolution.',
        },
        feedback: {
          rating: numRating,
          comment: feedback || '',
          submittedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };

      const timelineEntry = {
        id: `tl-${Date.now()}`,
        status: 'CLOSED',
        title: 'Citizen Verified & Closed',
        description: `Citizen verified the work: Satisfied (Rating: ${numRating}/5). "${feedback || 'No comments'}"`,
        performedBy: user.name,
        performedByRole: 'citizen',
        timestamp: new Date().toISOString(),
      };

      updates.timeline = [...(g.timeline || []), timelineEntry];
      const updated = db.updateGrievance(g.id, updates);

      // Notify officer
      if (g.assignedOfficerId) {
        NotificationService.createNotification({
          userId: g.assignedOfficerId,
          title: `Grievance Closed (${numRating}★)`,
          message: `Citizen confirmed satisfaction for ${g.complaintId}. Rated ${numRating}/5.`,
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
        details: `Closed with ${numRating} star rating. Feedback: ${feedback || 'None'}`,
      });

      return {
        ...updated,
        slaInfo: computeSLAStatus(updated),
      };
    } else {
      // Citizen rejected resolution -> REOPENED & ESCALATED
      if (!['AWAITING_VERIFICATION', 'RESOLUTION_SUBMITTED', 'CLOSED'].includes(g.status)) {
        throw new HttpError(400, `Cannot reopen grievance currently in status '${g.status}'.`);
      }

      const reasonText = (reopenReason || data.reason || '').trim();
      if (!reasonText || reasonText.length < 5) {
        throw new HttpError(400, 'A detailed reason (minimum 5 characters) is required when reopening a case.');
      }

      // Fresh SLA deadline on reopen so it does not stay expired from days ago
      const freshSla = calculateSLADeadline(Math.min(g.slaHours || 48, 48));

      const updates = {
        status: 'REOPENED',
        isEscalated: true,
        escalationReason: `Citizen rejected resolution: ${reasonText}`,
        slaStartedAt: freshSla.slaStartedAt,
        slaDeadline: freshSla.slaDeadline,
        isOverdue: false,
        verification: {
          verifiedBy: user.name,
          verifiedAt: new Date().toISOString(),
          satisfied: false,
          reopenReason: reasonText,
          citizenRemarks: reasonText,
        },
        updatedAt: new Date().toISOString(),
      };

      const timelineEntry = {
        id: `tl-${Date.now()}`,
        status: 'REOPENED',
        title: 'Resolution Rejected - Grievance Reopened',
        description: `Citizen rejected resolution: "${reasonText}". Case reopened and escalated.`,
        performedBy: user.name,
        performedByRole: 'citizen',
        timestamp: new Date().toISOString(),
      };

      updates.timeline = [...(g.timeline || []), timelineEntry];
      const updated = db.updateGrievance(g.id, updates);

      // Notify officer
      if (g.assignedOfficerId) {
        NotificationService.createNotification({
          userId: g.assignedOfficerId,
          title: `⚠️ Case Reopened: ${g.complaintId}`,
          message: `Citizen rejected resolution. Reason: ${reasonText}`,
          type: 'error',
          grievanceId: g.id,
        });
      }

      // Notify Department Head
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
        details: `Reopened with reason: ${reasonText}`,
      });

      return {
        ...updated,
        slaInfo: computeSLAStatus(updated),
      };
    }
  }
}
