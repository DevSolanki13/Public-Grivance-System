import { db } from '../db.js';
import { computeSLAStatus } from './slaService.js';

export class AnalyticsService {
  static getDashboardStats(user) {
    const grievances = db.getGrievances();

    let scoped = [...grievances];
    if (user?.role === 'citizen') {
      scoped = scoped.filter((g) => g.citizenId === user.id);
    } else if (user?.role === 'officer') {
      scoped = scoped.filter((g) => g.assignedOfficerId === user.id);
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

    const overdue = scoped.filter((g) => !['CLOSED', 'REJECTED'].includes(g.status) && computeSLAStatus(g).isOverdue).length;

    const slaCompliance = total > 0 ? Math.max(0, Math.round(((total - overdue) / total) * 100)) : 100;

    // Calculate average resolution time for closed complaints
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

  static getMapMarkers() {
    const grievances = db.getGrievances();
    const wardCoords = [
      { lat: 19.3052, lng: 72.8480, area: 'Ward 1: Station West' },
      { lat: 19.2965, lng: 72.8540, area: 'Ward 2: Market Area' },
      { lat: 19.3120, lng: 72.8620, area: 'Ward 3: Industrial East' },
      { lat: 19.2890, lng: 72.8650, area: 'Ward 4: Highway Corridor' },
      { lat: 19.3080, lng: 72.8420, area: 'Ward 5: Navghar Road' },
      { lat: 19.2990, lng: 72.8390, area: 'Ward 6: Maxus Mall Belt' },
    ];

    return grievances.map((g, index) => {
      const fallback = wardCoords[index % wardCoords.length];
      const latitude = g.location?.latitude && g.location.latitude !== 19.3012
        ? g.location.latitude
        : fallback.lat + ((index * 0.002) % 0.005);
      const longitude = g.location?.longitude && g.location.longitude !== 72.8519
        ? g.location.longitude
        : fallback.lng + (((index * 0.003) % 0.006) - 0.002);

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

  static getAuditLogs() {
    return db.getAuditLogs();
  }
}
