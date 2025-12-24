import { jsonError, jsonOk } from '@/app/api/_utils';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/tables';
import crypto from 'crypto';

function getClientIp(req: Request) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim();
  return req.headers.get('x-real-ip')?.trim() ?? null;
}

function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function POST(req: Request) {
  try {
    // Flag para desativar cadastro rapidamente (sem mudar banco)
    if (process.env.DISABLE_SIGNUP === 'true') {
      return jsonError('Cadastro temporariamente desativado', 403);
    }

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

    // Rate limit simples por IP (janela fixa) usando a própria base
    const ip = getClientIp(req) ?? 'unknown';
    const windowSec = Number(process.env.SIGNUP_RATE_LIMIT_WINDOW_SEC ?? '600'); // 10 min
    const max = Number(process.env.SIGNUP_RATE_LIMIT_MAX ?? '10'); // 10 tentativas / janela
    const salt = process.env.RATE_LIMIT_SALT ?? 'gestao_marcenaria_default_salt';
    const ipHash = sha256(`${salt}:${ip}`);
    const now = new Date();
    const windowStart = new Date(Math.floor(now.getTime() / (windowSec * 1000)) * windowSec * 1000).toISOString();

    // upsert + increment
    const { data: rlRow, error: rlErr } = await supabase
      .from('gestao_marcenaria__rate_limit_signup')
      .upsert({ ip_hash: ipHash, window_start: windowStart, count: 0 }, { onConflict: 'ip_hash,window_start' })
      .select('count')
      .single();
    if (rlErr) return jsonError(rlErr.message, 500);

    const current = Number((rlRow as any)?.count ?? 0);
    if (current >= max) return jsonError('Muitas tentativas. Tente novamente mais tarde.', 429);

    const { error: incErr } = await supabase
      .from('gestao_marcenaria__rate_limit_signup')
      .update({ count: current + 1 })
      .eq('ip_hash', ipHash)
      .eq('window_start', windowStart);
    if (incErr) return jsonError(incErr.message, 500);

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


