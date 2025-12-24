import { jsonError, jsonOk } from '@/app/api/_utils';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/tables';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nomeTenant = String(body?.nomeTenant ?? '').trim();
    const nomeUsuario = String(body?.nomeUsuario ?? '').trim();
    const email = String(body?.email ?? '').trim();
    const password = String(body?.senha ?? '');

    if (!nomeTenant) return jsonError('Informe o nome da empresa/ambiente');
    if (!nomeUsuario) return jsonError('Informe seu nome');
    if (!email) return jsonError('Informe o e-mail');
    if (!password || password.length < 6) return jsonError('Senha deve ter pelo menos 6 caracteres');

    const supabase = getSupabaseAdmin();

    // Cria o usuário já confirmado para NÃO depender de envio de e-mail (SMTP/confirmations).
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) return jsonError(createErr.message, 400);
    const userId = created.user?.id;
    if (!userId) return jsonError('Falha ao criar usuário', 500);

    // Perfil do usuário (tabela do sistema)
    const { error: perfilErr } = await supabase.from(TABLES.usuarios).upsert({
      user_id: userId,
      email,
      nome: nomeUsuario,
    });
    if (perfilErr) return jsonError(perfilErr.message, 500);

    // Cria tenant + vínculo (service role ignora RLS, então funciona mesmo antes do usuário logar)
    const { data: tenant, error: tenantErr } = await supabase
      .from(TABLES.tenants)
      .insert({ nome: nomeTenant })
      .select('id')
      .single();
    if (tenantErr) return jsonError(tenantErr.message, 500);

    const tenantId = (tenant as any).id as string;

    const { error: membroErr } = await supabase.from(TABLES.tenantMembros).insert({
      tenant_id: tenantId,
      user_id: userId,
      papel: 'admin',
    });
    if (membroErr) return jsonError(membroErr.message, 500);

    return jsonOk({ userId, tenantId });
  } catch (e: any) {
    return jsonError(e?.message ?? 'Erro inesperado', 500);
  }
}


