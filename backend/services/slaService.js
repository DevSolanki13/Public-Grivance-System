/**
 * SLA Service - Calculates deadlines, monitors overdue states, and triggers escalation flags
 */

export function calculateSLADeadline(slaHours = 48, fromDate = new Date()) {
  const start = new Date(fromDate);
  const deadline = new Date(start.getTime() + slaHours * 3600 * 1000);
  return {
    slaStartedAt: start.toISOString(),
    slaDeadline: deadline.toISOString(),
  };
}

export function computeSLAStatus(grievance) {
  if (['CLOSED', 'REJECTED'].includes(grievance.status)) {
    const finishTime = new Date(grievance.closedAt || grievance.resolvedAt || grievance.updatedAt).getTime();
    const deadlineTime = new Date(grievance.slaDeadline).getTime();
    const isWithinSla = finishTime <= deadlineTime;
    return {
      status: isWithinSla ? 'RESOLVED_WITHIN_SLA' : 'RESOLVED_AFTER_SLA',
      timeText: isWithinSla ? 'Resolved on time' : 'Resolved after deadline',
      isOverdue: !isWithinSla,
    };
  }

  const now = Date.now();
  const deadline = new Date(grievance.slaDeadline).getTime();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    const overdueHours = Math.abs(Math.floor(diffMs / (3600 * 1000)));
    const overdueDays = Math.floor(overdueHours / 24);
    const text = overdueDays > 0 ? `${overdueDays}d ${overdueHours % 24}h overdue` : `${overdueHours}h overdue`;
    return {
      status: 'OVERDUE',
      timeText: text,
      isOverdue: true,
      diffHours: Math.floor(diffMs / (3600 * 1000)),
    };
  }

  const remainingHours = Math.floor(diffMs / (3600 * 1000));
  const remainingDays = Math.floor(remainingHours / 24);

  if (remainingHours <= 12) {
    return {
      status: 'DUE_SOON',
      timeText: `${remainingHours}h remaining`,
      isOverdue: false,
      diffHours: remainingHours,
    };
  }

  const text = remainingDays > 0 ? `${remainingDays}d ${remainingHours % 24}h left` : `${remainingHours}h left`;
  return {
    status: 'ON_TRACK',
    timeText: text,
    isOverdue: false,
    diffHours: remainingHours,
  };
}

export function evaluateAllGrievancesSLA(grievances) {
  let updatedCount = 0;
  grievances.forEach((g) => {
    if (!['CLOSED', 'REJECTED'].includes(g.status)) {
      const sla = computeSLAStatus(g);
      if (sla.isOverdue && !g.isOverdue) {
        g.isOverdue = true;
        g.isEscalated = true;
        g.escalationReason = 'Automatic SLA deadline breach';
        updatedCount++;
      }
    }
  });
  return updatedCount;
}
