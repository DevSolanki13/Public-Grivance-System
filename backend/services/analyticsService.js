import { db } from '../db.js';
import { computeSLAStatus } from './slaService.js';

export class AnalyticsService {
  static getDashboardStats(user) {
    const grievances = db.getGrievances();

    let scoped = [...grievances];
    if (user?.role === 'citizen') {
      scoped = scoped.filter((g) => g.citizenId === user.id);
    } else if (user?.role === 'officer') {
      scoped = scoped.filter((g) => g.assignedOfficerId === user.id || g.departmentId === user.departmentId);
    } else if (user?.role === 'department_head') {
      scoped = scoped.filter((g) => g.departmentId === user.departmentId);
    }

    const total = scoped.length;
    const pending = scoped.filter((g) => ['SUBMITTED', 'UNDER_REVIEW'].includes(g.status)).length;
    const inProgress = scoped.filter((g) => ['ASSIGNED', 'IN_PROGRESS'].includes(g.status)).length;
    const awaitingVerification = scoped.filter((g) => ['RESOLUTION_SUBMITTED', 'AWAITING_VERIFICATION'].includes(g.status)).length;
    const resolved = scoped.filter((g) => g.status === 'CLOSED').length;
    const reopened = scoped.filter((g) => g.status === 'REOPENED').length;
    const escalated = scoped.filter((g) => g.isEscalated).length;

    // Accurate calculation: complaints currently active and overdue
    const overdue = scoped.filter((g) => !['CLOSED', 'REJECTED'].includes(g.status) && computeSLAStatus(g).isOverdue).length;

    // Accurate compliance: account for both currently overdue complaints and complaints resolved late
    const breachedTotal = scoped.filter((g) => {
      if (['CLOSED', 'REJECTED'].includes(g.status)) {
        const finishTime = new Date(g.closedAt || g.resolvedAt || g.updatedAt).getTime();
        const deadlineTime = new Date(g.slaDeadline).getTime();
        return !isNaN(finishTime) && !isNaN(deadlineTime) && finishTime > deadlineTime;
      }
      return computeSLAStatus(g).isOverdue;
    }).length;

    const slaCompliance = total > 0 ? Math.max(0, Math.round(((total - breachedTotal) / total) * 100)) : 100;

    // Calculate average resolution time for closed complaints in hours
    const closed = scoped.filter((g) => g.status === 'CLOSED' && g.closedAt && g.createdAt);
    let avgHours = 0;
    if (closed.length > 0) {
      const totalHours = closed.reduce((acc, curr) => {
        const diffMs = new Date(curr.closedAt).getTime() - new Date(curr.createdAt).getTime();
        return acc + diffMs / (3600 * 1000);
      }, 0);
      avgHours = Math.round((totalHours / closed.length) * 10) / 10;
    }

    return {
      total,
      pending,
      inProgress,
      awaitingVerification,
      resolved,
      reopened,
      overdue,
      escalated,
      slaCompliance,
      averageResolutionHours: avgHours,
    };
  }

  static getMapMarkers(user) {
    let grievances = db.getGrievances();

    // Scoping for authenticated roles
    if (user?.role === 'citizen') {
      grievances = grievances.filter((g) => g.citizenId === user.id);
    } else if (user?.role === 'department_head') {
      grievances = grievances.filter((g) => g.departmentId === user.departmentId);
    } else if (user?.role === 'officer') {
      grievances = grievances.filter((g) => g.assignedOfficerId === user.id || g.departmentId === user.departmentId);
    }

    const defaultWardCoords = [
      { lat: 19.3052, lng: 72.8480, area: 'Ward 1: Station West' },
      { lat: 19.2965, lng: 72.8540, area: 'Ward 2: Market Area' },
      { lat: 19.3120, lng: 72.8620, area: 'Ward 3: Industrial East' },
      { lat: 19.2890, lng: 72.8650, area: 'Ward 4: Highway Corridor' },
      { lat: 19.3080, lng: 72.8420, area: 'Ward 5: Navghar Road' },
      { lat: 19.2990, lng: 72.8390, area: 'Ward 6: Maxus Mall Belt' },
    ];

    return grievances.map((g, index) => {
      const fallback = defaultWardCoords[index % defaultWardCoords.length];
      const hasValidCoords =
        typeof g.location?.latitude === 'number' &&
        !isNaN(g.location.latitude) &&
        typeof g.location?.longitude === 'number' &&
        !isNaN(g.location.longitude);

      const latitude = hasValidCoords ? g.location.latitude : fallback.lat;
      const longitude = hasValidCoords ? g.location.longitude : fallback.lng;

      return {
        id: g.id,
        complaintId: g.complaintId,
        subject: g.subject,
        category: g.category,
        department: g.department,
        status: g.status,
        priority: g.priority,
        area: g.location?.area || fallback.area,
        address: g.location?.address || `${fallback.area}, Municipal Ward`,
        latitude,
        longitude,
        slaInfo: computeSLAStatus(g),
        color:
          g.priority === 'CRITICAL' || g.priority === 'URGENT'
            ? '#ef4444'
            : g.priority === 'HIGH'
            ? '#f97316'
            : g.priority === 'MEDIUM'
            ? '#eab308'
            : '#10b981',
      };
    });
  }

  static getAuditLogs(user) {
    let logs = db.getAuditLogs();
    if (user?.role === 'department_head') {
      const deptGrievanceIds = new Set(
        db.getGrievances().filter((g) => g.departmentId === user.departmentId).map((g) => g.id)
      );
      logs = logs.filter((l) => deptGrievanceIds.has(l.grievanceId));
    }
    return logs;
  }
}
