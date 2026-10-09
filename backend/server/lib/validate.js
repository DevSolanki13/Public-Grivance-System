import { HttpError } from './errors.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COMPLAINT_RE = /^GRV-\d{4}-\d+$/i;

export const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);

// Light request-shape checks. The database enforces the real rules
// (lengths, allowed statuses, permissions) and its messages are passed through.
export function str(body, key, { required = false, max = 5000 } = {}) {
  const value = body?.[key];
  if (value === undefined || value === null || value === '') {
    if (required) throw new HttpError(400, `"${key}" is required.`);
    return undefined;
  }
  if (typeof value !== 'string') throw new HttpError(400, `"${key}" must be a string.`);
  if (value.length > max) throw new HttpError(400, `"${key}" is too long.`);
  return value;
}

export function num(body, key) {
  const value = body?.[key];
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new HttpError(400, `"${key}" must be a number.`);
  return n;
}

export function grievanceIdParam(id) {
  if (isUuid(id)) return { column: 'id', value: id };
  if (COMPLAINT_RE.test(id)) return { column: 'complaint_id', value: id.toUpperCase() };
  throw new HttpError(400, 'Invalid grievance id.');
}

export function uuidParam(id, name = 'id') {
  if (!isUuid(id)) throw new HttpError(400, `Invalid ${name}.`);
  return id;
}
