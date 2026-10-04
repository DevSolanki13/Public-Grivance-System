/**
 * JanSewa Domain Constants & Status Definitions
 * Unified single source of truth
 */

import { GRIEVANCE_STATUSES } from '../services/stateMachine.js';
import { INITIAL_DEPARTMENTS, INITIAL_CATEGORIES } from '../db.js';

export { GRIEVANCE_STATUSES };

export const ROLES = {
  CITIZEN: 'citizen',
  OFFICER: 'officer',
  DEPARTMENT_HEAD: 'department_head',
  ADMIN: 'admin',
};

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT'];

export const PRIORITY_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
  URGENT: 'URGENT',
};

export const DEFAULT_SLA_HOURS = {
  CRITICAL: 24,
  URGENT: 24,
  HIGH: 48,
  MEDIUM: 72,
  LOW: 120,
};

export const DEPARTMENTS = INITIAL_DEPARTMENTS;
export const CATEGORIES = INITIAL_CATEGORIES;
