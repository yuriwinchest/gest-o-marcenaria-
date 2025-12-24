import { createClient } from '@supabase/supabase-js';

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function getSupabaseAdmin() {
  // Vercel/Supabase podem expor URL como SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_URL.
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Missing env var: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
  // A integração da Vercel/Supabase pode expor como SUPABASE_SERVICE_ROLE_KEY (jwt) ou SUPABASE_SECRET_KEY (sb_secret).
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!serviceRoleKey) throw new Error('Missing env var: SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)');

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}


