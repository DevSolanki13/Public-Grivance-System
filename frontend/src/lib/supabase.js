import { createClient } from '@supabase/supabase-js';

// Values come from your .env file (see .env.example).
// Vite only exposes variables that start with VITE_.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && import.meta.env.MODE !== 'test') {
  console.error('Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(url || 'http://127.0.0.1:54321', anonKey || 'missing-anon-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export const PHOTO_BUCKET = 'grievance-photos';

// Turns Supabase / Postgres errors into messages a citizen can understand.
const authMessages = {
  'Invalid login credentials': 'Incorrect email or password.',
  'User already registered': 'This email is already registered. Try logging in.',
  'Email not confirmed': 'Please confirm your email address before logging in.',
  'Unable to validate email address: invalid format': 'Please enter a valid email address.',
};

export function friendlyError(err) {
  if (!err) return 'Something went wrong. Please try again.';
  // Errors from our Express API already carry a readable message.
  if (err.name === 'ApiError') {
    if (err.status === 401) return 'Your session has expired. Please sign in again.';
    return err.message;
  }
  const message = err.message || String(err);
  if (authMessages[message]) return authMessages[message];
  if (/password should be at least/i.test(message)) return 'Password must be at least 6 characters.';
  if (/failed to fetch|network/i.test(message)) return 'Network problem. Check your internet connection.';
  if (err.code === '42501') return message.includes('row-level security') ? 'You do not have permission to do that.' : message;
  // Our database functions raise readable messages with these codes.
  if (err.code === '22023' || err.code === 'P0002') return message;
  if (err.code === '23514') return 'Some of the details entered are invalid. Please check the form.';
  return message || 'Something went wrong. Please try again.';
}
