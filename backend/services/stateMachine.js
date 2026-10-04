/**
 * JanSewa Grievance State Machine
 * Defines valid status transitions and permitted roles.
 */

export const GRIEVANCE_STATUSES = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLUTION_SUBMITTED: 'RESOLUTION_SUBMITTED',
  AWAITING_VERIFICATION: 'AWAITING_VERIFICATION',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED',
  ESCALATED: 'ESCALATED',
  REJECTED: 'REJECTED',
};

export const ALLOWED_TRANSITIONS = {
  SUBMITTED: ['UNDER_REVIEW', 'ASSIGNED', 'REJECTED'],
  UNDER_REVIEW: ['ASSIGNED', 'REJECTED'],
  ASSIGNED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLUTION_SUBMITTED', 'AWAITING_VERIFICATION'],
  RESOLUTION_SUBMITTED: ['AWAITING_VERIFICATION', 'CLOSED', 'REOPENED'],
  AWAITING_VERIFICATION: ['CLOSED', 'REOPENED'],
  REOPENED: ['ASSIGNED', 'IN_PROGRESS'],
  CLOSED: ['REOPENED'],
  REJECTED: [],
};

export function isValidTransition(fromStatus, toStatus) {
  if (!fromStatus || !toStatus) return false;
  if (fromStatus === toStatus) return false; // Prevent no-op transitions spamming timeline
  const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
}

export function canRoleTransition(role, fromStatus, toStatus, isAssignee = false, isCreator = false) {
  if (role === 'admin') return true;

  if (role === 'department_head') {
    return ['UNDER_REVIEW', 'ASSIGNED', 'REJECTED'].includes(toStatus);
  }

  if (role === 'officer') {
    // Only the specifically assigned officer can advance work or submit resolution
    if (!isAssignee) return false;
    return ['IN_PROGRESS', 'RESOLUTION_SUBMITTED', 'AWAITING_VERIFICATION'].includes(toStatus);
  }

  if (role === 'citizen') {
    // Only the complaint creator can verify or reopen
    if (!isCreator) return false;
    if (fromStatus === 'AWAITING_VERIFICATION' || fromStatus === 'RESOLUTION_SUBMITTED') {
      return ['CLOSED', 'REOPENED'].includes(toStatus);
    }
    if (fromStatus === 'CLOSED') {
      return toStatus === 'REOPENED';
    }
    return false;
  }

  return false;
}
