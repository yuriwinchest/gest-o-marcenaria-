import { createClient } from '@supabase/supabase-js';

export function getSupabaseBrowser() {
  // IMPORTANTE: em Client Components, o Next.js só injeta env vars quando a chave é acessada diretamente.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL');
  if (!anon) throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}


