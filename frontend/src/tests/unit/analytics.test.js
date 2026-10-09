/**
 * UNIT TESTS: analytics helpers used by dashboards and the transparency portal.
 */
import { describe, it, expect } from 'vitest';
import { summarize, countBy, departmentPerformance, officerWorkload, isOverdue, isResolvedOnTime } from '../../utils/analytics';

const now = new Date('2026-10-06T12:00:00Z');
const hoursAgo = (h) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

const grievances = [
  // Critical (24h SLA) resolved in 10h → on time, closed with rating 5
  { id: 1, category: 'Water Supply', department: 'Water Department', priority: 'Critical', status: 'Closed', createdAt: hoursAgo(100), resolvedAt: hoursAgo(90), rating: 5, assignedOfficerId: 'o1' },
  // Medium (72h SLA) resolved in 80h → late, awaiting verification
  { id: 2, category: 'Sanitation', department: 'Sanitation Department', priority: 'Medium', status: 'Resolved', createdAt: hoursAgo(100), resolvedAt: hoursAgo(20), rating: null, assignedOfficerId: 'o2' },
  // High (48h SLA) still in progress after 60h → overdue
  { id: 3, category: 'Sanitation', department: 'Sanitation Department', priority: 'High', status: 'In Progress', createdAt: hoursAgo(60), assignedOfficerId: 'o2' },
  // Fresh submission
  { id: 4, category: 'Road & Infrastructure', department: 'PWD (Roads & Infrastructure)', priority: 'Low', status: 'Submitted', createdAt: hoursAgo(2) },
  { id: 5, category: 'Other', department: 'General Municipal Administration', priority: 'Low', status: 'Rejected', createdAt: hoursAgo(300), rating: null },
];

describe('SLA helpers', () => {
  it('isResolvedOnTime compares resolution time to the priority SLA', () => {
    expect(isResolvedOnTime(grievances[0])).toBe(true);
    expect(isResolvedOnTime(grievances[1])).toBe(false);
    expect(isResolvedOnTime(grievances[2])).toBe(false);
  });

  it('isOverdue flags only open, unresolved cases past their SLA', () => {
    expect(isOverdue(grievances[2], now)).toBe(true);
    expect(isOverdue(grievances[3], now)).toBe(false);
    expect(isOverdue(grievances[1], now)).toBe(false); // resolved, waiting on citizen
    expect(isOverdue(grievances[4], now)).toBe(false); // rejected
  });
});

describe('summarize()', () => {
  it('computes counts, SLA rate, turnaround and rating from the data', () => {
    expect(summarize(grievances, now)).toEqual({
      total: 5,
      active: 3,
      pendingTriage: 1,
      inProgress: 1,
      awaitingVerification: 1,
      closed: 1,
      rejected: 1,
      overdue: 1,
      slaRate: 50,
      avgResolutionHours: 45,
      avgRating: 5,
    });
  });

  it('returns nulls instead of fake numbers when there is no data', () => {
    const s = summarize([]);
    expect(s.total).toBe(0);
    expect(s.slaRate).toBeNull();
    expect(s.avgResolutionHours).toBeNull();
    expect(s.avgRating).toBeNull();
  });
});

describe('countBy() and departmentPerformance()', () => {
  it('counts categories with percentages, largest first', () => {
    expect(countBy(grievances, 'category')[0]).toEqual({ name: 'Sanitation', count: 2, percentage: 40 });
  });

  it('reports per-department totals and SLA', () => {
    const sanitation = departmentPerformance(grievances).find((d) => d.name === 'Sanitation Department');
    expect(sanitation).toEqual({ name: 'Sanitation Department', total: 2, resolved: 1, slaRate: 0, avgResolutionHours: 80 });
  });
});

describe('officerWorkload()', () => {
  it('derives each officer\'s load and state from their assigned cases', () => {
    const rows = officerWorkload(
      [{ id: 'o1', name: 'A', department: 'Water Department' }, { id: 'o2', name: 'B', department: 'Sanitation Department' }, { id: 'o3', name: 'C' }],
      grievances,
      now
    );
    expect(rows.find((r) => r.id === 'o1')).toMatchObject({ assigned: 1, active: 0, overdue: 0, state: 'Available', slaRate: 100 });
    expect(rows.find((r) => r.id === 'o2')).toMatchObject({ assigned: 2, active: 2, inProgress: 1, overdue: 1, state: 'High Workload' });
    expect(rows.find((r) => r.id === 'o3')).toMatchObject({ assigned: 0, state: 'Available', slaRate: null });
  });
});
