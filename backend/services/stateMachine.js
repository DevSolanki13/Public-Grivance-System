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

const ALLOWED_TRANSITIONS = {
  SUBMITTED: ['UNDER_REVIEW', 'ASSIGNED', 'REJECTED', 'IN_PROGRESS'],
  UNDER_REVIEW: ['ASSIGNED', 'IN_PROGRESS', 'REJECTED'],
  ASSIGNED: ['IN_PROGRESS', 'ASSIGNED', 'REJECTED'],
  IN_PROGRESS: ['RESOLUTION_SUBMITTED', 'AWAITING_VERIFICATION', 'ASSIGNED'],
  RESOLUTION_SUBMITTED: ['AWAITING_VERIFICATION', 'CLOSED', 'REOPENED'],
  AWAITING_VERIFICATION: ['CLOSED', 'REOPENED'],
  REOPENED: ['ASSIGNED', 'IN_PROGRESS', 'AWAITING_VERIFICATION'],
  CLOSED: ['REOPENED'],
  REJECTED: [],
};

export function canRoleTransition(role, fromStatus, toStatus, isAssignee = false, isCreator = false) {
  if (role === 'admin') return true;

  if (role === 'department_head') {
    return ['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'REJECTED'].includes(toStatus);
  }

  if (role === 'officer') {
    // Allows officers to accept and resolve assigned or in-progress field cases
    return ['IN_PROGRESS', 'RESOLUTION_SUBMITTED', 'AWAITING_VERIFICATION'].includes(toStatus);
  }

  if (role === 'citizen') {
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

export function isValidTransition(fromStatus, toStatus) {
  if (fromStatus === toStatus) return true;
  const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
}
