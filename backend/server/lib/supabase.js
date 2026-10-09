import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

// Client with no user: can only reach what anonymous visitors may see.
export const anonClient = createClient(config.supabaseUrl, config.supabaseAnonKey, options);

// Client that acts AS the signed-in user (their JWT is sent with every query).
export function clientForToken(token) {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    ...options,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
