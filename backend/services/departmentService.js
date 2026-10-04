import { db } from '../db.js';
import { computeSLAStatus } from './slaService.js';

export class DepartmentService {
  static getDepartments() {
    const grievances = db.getGrievances();
    const officers = db.getUsers().filter((u) => u.role === 'officer');

    return db.getDepartments().map((dept) => {
      const deptGrievances = grievances.filter((g) => g.departmentId === dept.id);
      const active = deptGrievances.filter((g) => !['CLOSED', 'REJECTED'].includes(g.status));
      const resolved = deptGrievances.filter((g) => g.status === 'CLOSED');
      const overdue = active.filter((g) => computeSLAStatus(g).isOverdue);
      const deptOfficers = officers.filter((o) => o.departmentId === dept.id);

      return {
        ...dept,
        officerCount: deptOfficers.length,
        totalGrievances: deptGrievances.length,
        activeGrievances: active.length,
        resolvedGrievances: resolved.length,
        overdueCount: overdue.length,
        slaCompliance: deptGrievances.length > 0 ? Math.round(((deptGrievances.length - overdue.length) / deptGrievances.length) * 100) : 100,
      };
    });
  }

  static getOfficers(departmentId) {
    let officers = db.getUsers().filter((u) => u.role === 'officer');

    if (departmentId && departmentId !== 'All') {
      officers = officers.filter((o) => o.departmentId === departmentId);
    }

    const grievances = db.getGrievances();

    return officers.map((off) => {
      const assigned = grievances.filter((g) => g.assignedOfficerId === off.id);
      const active = assigned.filter((g) => !['CLOSED', 'REJECTED'].includes(g.status));
      const overdue = active.filter((g) => computeSLAStatus(g).isOverdue);
      const resolved = assigned.filter((g) => g.status === 'CLOSED');

      return {
        id: off.id,
        name: off.name,
        email: off.email,
        phone: off.phone,
        departmentId: off.departmentId,
        departmentName: off.departmentName,
        designation: off.designation || 'Officer',
        activeCases: active.length,
        overdueCases: overdue.length,
        resolvedCases: resolved.length,
        workloadLevel: active.length > 8 ? 'High' : active.length > 3 ? 'Medium' : 'Optimal',
      };
    });
  }

  static getCategories() {
    return db.getCategories();
  }
}
