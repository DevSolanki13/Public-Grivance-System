import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidTransition,
  canRoleTransition,
  GRIEVANCE_STATUSES,
} from '../services/stateMachine.js';

describe('State Machine Transitions', () => {
  it('should allow valid sequential lifecycle transitions', () => {
    assert.equal(isValidTransition('SUBMITTED', 'UNDER_REVIEW'), true);
    assert.equal(isValidTransition('SUBMITTED', 'ASSIGNED'), true);
    assert.equal(isValidTransition('ASSIGNED', 'IN_PROGRESS'), true);
    assert.equal(isValidTransition('IN_PROGRESS', 'AWAITING_VERIFICATION'), true);
    assert.equal(isValidTransition('AWAITING_VERIFICATION', 'CLOSED'), true);
    assert.equal(isValidTransition('AWAITING_VERIFICATION', 'REOPENED'), true);
  });

  it('should reject no-op transitions (same status to same status)', () => {
    assert.equal(isValidTransition('SUBMITTED', 'SUBMITTED'), false);
    assert.equal(isValidTransition('IN_PROGRESS', 'IN_PROGRESS'), false);
    assert.equal(isValidTransition('CLOSED', 'CLOSED'), false);
  });

  it('should reject illegal backwards or bypass transitions', () => {
    assert.equal(isValidTransition('SUBMITTED', 'CLOSED'), false);
    assert.equal(isValidTransition('SUBMITTED', 'IN_PROGRESS'), false);
    assert.equal(isValidTransition('REJECTED', 'IN_PROGRESS'), false);
  });

  it('should enforce role-based transition authorization', () => {
    // Admin can perform transitions
    assert.equal(canRoleTransition('admin', 'SUBMITTED', 'ASSIGNED'), true);

    // Citizen can only close or reopen if they are the creator
    assert.equal(canRoleTransition('citizen', 'AWAITING_VERIFICATION', 'CLOSED', false, true), true);
    assert.equal(canRoleTransition('citizen', 'AWAITING_VERIFICATION', 'CLOSED', false, false), false);
    assert.equal(canRoleTransition('citizen', 'SUBMITTED', 'ASSIGNED', false, true), false);

    // Officer can only advance in-progress / verification if they are the assigned officer
    assert.equal(canRoleTransition('officer', 'ASSIGNED', 'IN_PROGRESS', true, false), true);
    assert.equal(canRoleTransition('officer', 'ASSIGNED', 'IN_PROGRESS', false, false), false);

    // Dept head can assign and review cases
    assert.equal(canRoleTransition('department_head', 'SUBMITTED', 'ASSIGNED'), true);
    assert.equal(canRoleTransition('department_head', 'AWAITING_VERIFICATION', 'CLOSED'), false);
  });
});
