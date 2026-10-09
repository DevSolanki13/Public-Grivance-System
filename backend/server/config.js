// Reads backend/.env (Node 20.12+) and exposes validated settings.
try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch {
  // No .env file: use variables from the environment (e.g. in production/CI).
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name} (see backend/.env.example)`);
  return value;
}

export const config = {
  // API_PORT (not PORT): dev tools and hosts often set PORT for other processes.
  port: Number(process.env.API_PORT) || 4000,
  supabaseUrl: required('SUPABASE_URL'),
  // The API only ever uses the anon key plus the caller's own token, so
  // Row Level Security applies to every query it makes.
  supabaseAnonKey: required('SUPABASE_ANON_KEY'),
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};
