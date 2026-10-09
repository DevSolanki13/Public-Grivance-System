// An error with an HTTP status the error handler can send as-is.
export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Map Postgres / PostgREST error codes raised by Supabase to HTTP statuses.
const STATUS_BY_CODE = {
  42501: 403, // insufficient privilege / RLS violation
  P0002: 404, // raised by our functions: not found
  PGRST116: 404, // .single() found no row
  22023: 400, // raised by our functions: invalid parameter / wrong status
  23514: 400, // check constraint
  23502: 400, // not-null constraint
  23503: 400, // foreign key (e.g. unknown category)
  '22P02': 400, // invalid input syntax (bad uuid/enum)
};

export function fromSupabase(error) {
  const status = STATUS_BY_CODE[error.code] || 500;
  let message = error.message || 'Unexpected database error';
  if (error.code === '42501' && /row-level security/i.test(message)) {
    message = 'You do not have permission to do that.';
  } else if (['23514', '23502', '22P02'].includes(error.code)) {
    message = 'Some of the details entered are invalid. Please check the form.';
  } else if (error.code === '23503') {
    message = 'Unknown category or department.';
  }
  return new HttpError(status, message, error.code);
}

// Unwrap a Supabase { data, error } result, throwing an HttpError on failure.
export function unwrap({ data, error }) {
  if (error) throw fromSupabase(error);
  return data;
}
