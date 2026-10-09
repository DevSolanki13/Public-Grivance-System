import { SLA_HOURS, ARCHIVED_STATUSES } from '../data/reference';
import { parseDate } from './dateUtils';

const HOUR = 3600 * 1000;

export const isActive = (g) => !ARCHIVED_STATUSES.includes(g.status);
export const isArchived = (g) => ARCHIVED_STATUSES.includes(g.status);
export const isPendingTriage = (g) => g.status === 'Submitted' || g.status === 'Under Review';
export const isAwaitingVerification = (g) => g.status === 'Resolved';

export function slaHoursFor(priority) {
  return SLA_HOURS[priority] ?? SLA_HOURS.Medium;
}

// Hours from filing to the officer's resolution, or null if never resolved.
export function resolutionHours(g) {
  const created = parseDate(g.createdAt);
  const resolved = parseDate(g.resolvedAt);
  if (!created || !resolved) return null;
  return Math.max(0, (resolved - created) / HOUR);
}

export function isResolvedOnTime(g) {
  const hours = resolutionHours(g);
  return hours !== null && hours <= slaHoursFor(g.priority);
}

// An open case that has run past its SLA target.
export function isOverdue(g, now = new Date()) {
  if (!isActive(g) || g.status === 'Resolved') return false;
  const created = parseDate(g.createdAt);
  if (!created) return false;
  return (now - created) / HOUR > slaHoursFor(g.priority);
}

const round1 = (n) => Math.round(n * 10) / 10;

export function summarize(grievances, now = new Date()) {
  const resolvedCases = grievances.filter((g) => resolutionHours(g) !== null);
  const onTime = resolvedCases.filter(isResolvedOnTime).length;
  const rated = grievances.filter((g) => typeof g.rating === 'number');
  const totalHours = resolvedCases.reduce((sum, g) => sum + resolutionHours(g), 0);

  return {
    total: grievances.length,
    active: grievances.filter(isActive).length,
    pendingTriage: grievances.filter(isPendingTriage).length,
    inProgress: grievances.filter((g) => g.status === 'In Progress' || g.status === 'Reopened').length,
    awaitingVerification: grievances.filter(isAwaitingVerification).length,
    closed: grievances.filter((g) => g.status === 'Closed').length,
    rejected: grievances.filter((g) => g.status === 'Rejected').length,
    overdue: grievances.filter((g) => isOverdue(g, now)).length,
    slaRate: resolvedCases.length ? round1((onTime / resolvedCases.length) * 100) : null,
    avgResolutionHours: resolvedCases.length ? Math.round(totalHours / resolvedCases.length) : null,
    avgRating: rated.length ? round1(rated.reduce((s, g) => s + g.rating, 0) / rated.length) : null,
  };
}

export function countBy(grievances, key) {
  const counts = grievances.reduce((acc, g) => {
    const k = g[key] || 'Unassigned';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const total = grievances.length || 1;
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function departmentPerformance(grievances) {
  const byDept = new Map();
  for (const g of grievances) {
    if (!g.department) continue;
    if (!byDept.has(g.department)) byDept.set(g.department, []);
    byDept.get(g.department).push(g);
  }
  return [...byDept.entries()]
    .map(([name, list]) => {
      const s = summarize(list);
      return {
        name,
        total: list.length,
        resolved: list.filter((g) => g.resolvedAt).length,
        slaRate: s.slaRate,
        avgResolutionHours: s.avgResolutionHours,
      };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

// Workload per officer, computed from the grievances visible to the viewer.
export function officerWorkload(officers, grievances, now = new Date()) {
  return officers.map((o) => {
    const mine = grievances.filter((g) => g.assignedOfficerId === o.id);
    const active = mine.filter(isActive);
    const s = summarize(mine, now);
    const inProgress = active.filter((g) => g.status === 'In Progress' || g.status === 'Reopened').length;
    let state = 'Available';
    if (s.overdue > 0 || inProgress >= 5) state = 'High Workload';
    else if (inProgress > 0) state = 'Optimal';
    return {
      id: o.id,
      name: o.name,
      department: o.department,
      designation: o.designation,
      assigned: mine.length,
      active: active.length,
      inProgress,
      overdue: s.overdue,
      slaRate: s.slaRate,
      state,
    };
  });
}
