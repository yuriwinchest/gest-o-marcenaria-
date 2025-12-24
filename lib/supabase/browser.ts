import { createClient } from '@supabase/supabase-js';

function requiredPublicEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function getSupabaseBrowser() {
  const url = requiredPublicEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anon = requiredPublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}


