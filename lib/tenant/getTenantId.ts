import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { TABLES } from '@/lib/db/tables';

export async function getTenantIdOrThrow() {
  const supabase = getSupabaseBrowser();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from(TABLES.tenantMembros)
    .select('tenant_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (error) throw error;
  const tenantId = (data as any)?.tenant_id as string | undefined;
  if (!tenantId) throw new Error('Sem tenant. Complete o onboarding.');
  return tenantId;
}


