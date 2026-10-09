// JanSewa REST API — entry point.
//
// Express sits in front of Supabase. Every authenticated request carries the
// user's Supabase access token, and the API queries Supabase *as that user*,
// so the database's Row Level Security and workflow functions stay the single
// source of truth for permissions.
import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`JanSewa API listening on http://localhost:${config.port}`);
  console.log(`Using Supabase at ${config.supabaseUrl}`);
});
