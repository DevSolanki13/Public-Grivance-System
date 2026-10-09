/**
 * UNIT TESTS: friendlyError() turns Supabase/Postgres errors into citizen-readable text.
 */
import { describe, it, expect } from 'vitest';
import { friendlyError } from '../../lib/supabase';

describe('friendlyError()', () => {
  it('maps auth errors', () => {
    expect(friendlyError({ message: 'Invalid login credentials' })).toBe('Incorrect email or password.');
    expect(friendlyError({ message: 'User already registered' })).toMatch(/already registered/);
    expect(friendlyError({ message: 'Password should be at least 6 characters.' })).toBe('Password must be at least 6 characters.');
  });

  it('passes through readable workflow errors raised by the database', () => {
    expect(friendlyError({ code: '22023', message: 'A rejection reason of at least 5 characters is required' }))
      .toBe('A rejection reason of at least 5 characters is required');
  });

  it('hides raw RLS wording behind a permission message', () => {
    expect(friendlyError({ code: '42501', message: 'new row violates row-level security policy for table "grievances"' }))
      .toBe('You do not have permission to do that.');
  });

  it('handles network failures and empty errors', () => {
    expect(friendlyError(new TypeError('Failed to fetch'))).toMatch(/Network problem/);
    expect(friendlyError(null)).toMatch(/Something went wrong/);
  });
});

describe('friendlyError() with API errors', () => {
  const apiError = (status, message) => Object.assign(new Error(message), { name: 'ApiError', status });

  it('shows the API message as-is', () => {
    expect(friendlyError(apiError(400, 'Officer Amit Verma does not belong to Sanitation Department'))).toMatch(/does not belong/);
  });

  it('asks the user to sign in again on 401', () => {
    expect(friendlyError(apiError(401, 'Sign in required.'))).toMatch(/sign in again/);
  });
});
