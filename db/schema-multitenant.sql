-- Gestão de Marcenaria - Multi-tenant + Clientes + RLS
-- Rode no Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- ==========================================================
-- 1) Tenants (empresas/ambientes) + membros (vínculo usuário)
-- ==========================================================
create table if not exists public."gestao_marcenaria__tenants" (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now()
);

comment on table public."gestao_marcenaria__tenants" is 'Gestão de Marcenaria - Tenants (ambientes/empresas)';

create table if not exists public."gestao_marcenaria__tenant_membros" (
  tenant_id uuid not null references public."gestao_marcenaria__tenants"(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel text not null default 'admin' check (papel in ('admin','usuario')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

comment on table public."gestao_marcenaria__tenant_membros" is 'Gestão de Marcenaria - Vínculo usuário x tenant';

create index if not exists idx_gm_tenant_membros_user_id
  on public."gestao_marcenaria__tenant_membros"(user_id);

-- Função onboarding: cria tenant e vincula o usuário logado como admin
create or replace function public.gestao_marcenaria_onboard_tenant(nome_tenant text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_tenant_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  insert into public."gestao_marcenaria__tenants"(nome)
  values (nome_tenant)
  returning id into v_tenant_id;

  insert into public."gestao_marcenaria__tenant_membros"(tenant_id, user_id, papel)
  values (v_tenant_id, auth.uid(), 'admin');

  return v_tenant_id;
end;
$$;

-- ==========================================================
-- 2) Alterar tabelas existentes para incluir tenant_id
-- ==========================================================
alter table public."gestao_marcenaria__projetos_obras"
  add column if not exists tenant_id uuid;
alter table public."gestao_marcenaria__movimentacoes_financeiras"
  add column if not exists tenant_id uuid;
alter table public."gestao_marcenaria__contas_a_pagar"
  add column if not exists tenant_id uuid;
alter table public."gestao_marcenaria__contas_a_receber"
  add column if not exists tenant_id uuid;
alter table public."gestao_marcenaria__notas_fiscais"
  add column if not exists tenant_id uuid;

-- Índices por tenant
create index if not exists idx_gm_projetos_tenant on public."gestao_marcenaria__projetos_obras"(tenant_id);
create index if not exists idx_gm_mov_tenant on public."gestao_marcenaria__movimentacoes_financeiras"(tenant_id);
create index if not exists idx_gm_cp_tenant on public."gestao_marcenaria__contas_a_pagar"(tenant_id);
create index if not exists idx_gm_cr_tenant on public."gestao_marcenaria__contas_a_receber"(tenant_id);
create index if not exists idx_gm_nf_tenant on public."gestao_marcenaria__notas_fiscais"(tenant_id);

-- ==========================================================
-- 3) Clientes (cadastro completo)
-- ==========================================================
create table if not exists public."gestao_marcenaria__clientes" (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public."gestao_marcenaria__tenants"(id) on delete cascade,

  tipo_pessoa text not null default 'pj' check (tipo_pessoa in ('pf','pj')),
  nome text not null,
  razao_social text,
  nome_fantasia text,

  cpf_cnpj text,
  inscricao_estadual text,
  inscricao_municipal text,

  email text,
  telefone text,

  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  uf text,
  pais text default 'Brasil',

  observacoes text,
  created_at timestamptz not null default now()
);

comment on table public."gestao_marcenaria__clientes" is 'Gestão de Marcenaria - Clientes';

create index if not exists idx_gm_clientes_tenant on public."gestao_marcenaria__clientes"(tenant_id);
create index if not exists idx_gm_clientes_nome on public."gestao_marcenaria__clientes"(nome);

-- ==========================================================
-- 3.1) Usuários (perfil no schema public)
-- ==========================================================
create table if not exists public."gestao_marcenaria__usuarios" (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nome text,
  telefone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public."gestao_marcenaria__usuarios" is 'Gestão de Marcenaria - Usuários (perfil)';

-- Atualiza updated_at automaticamente
create or replace function public.gestao_marcenaria_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists gm_set_updated_at_usuarios on public."gestao_marcenaria__usuarios";
create trigger gm_set_updated_at_usuarios
before update on public."gestao_marcenaria__usuarios"
for each row execute function public.gestao_marcenaria_set_updated_at();

-- Cria perfil automaticamente quando um usuário é criado no auth.users
create or replace function public.gestao_marcenaria_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public."gestao_marcenaria__usuarios"(user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists gm_on_auth_user_created on auth.users;
create trigger gm_on_auth_user_created
after insert on auth.users
for each row execute function public.gestao_marcenaria_handle_new_user();

-- ==========================================================
-- 4) RLS (Row Level Security) - multi-tenant
-- ==========================================================
-- Helper: usuário pertence ao tenant?
create or replace function public.gestao_marcenaria_user_in_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public."gestao_marcenaria__tenant_membros" tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = auth.uid()
  );
$$;

-- Enable RLS
alter table public."gestao_marcenaria__tenants" enable row level security;
alter table public."gestao_marcenaria__tenant_membros" enable row level security;
alter table public."gestao_marcenaria__projetos_obras" enable row level security;
alter table public."gestao_marcenaria__movimentacoes_financeiras" enable row level security;
alter table public."gestao_marcenaria__contas_a_pagar" enable row level security;
alter table public."gestao_marcenaria__contas_a_receber" enable row level security;
alter table public."gestao_marcenaria__notas_fiscais" enable row level security;
alter table public."gestao_marcenaria__clientes" enable row level security;
alter table public."gestao_marcenaria__usuarios" enable row level security;

-- ==========================================================
-- 4.1) Privilégios (GRANT/REVOKE) - evita acesso indevido
-- ==========================================================
-- Por padrão, revogamos do PUBLIC e liberamos somente para authenticated.
revoke all on table
  public."gestao_marcenaria__tenants",
  public."gestao_marcenaria__tenant_membros",
  public."gestao_marcenaria__projetos_obras",
  public."gestao_marcenaria__movimentacoes_financeiras",
  public."gestao_marcenaria__contas_a_pagar",
  public."gestao_marcenaria__contas_a_receber",
  public."gestao_marcenaria__notas_fiscais",
  public."gestao_marcenaria__clientes",
  public."gestao_marcenaria__usuarios"
from public;

grant select, insert, update, delete on table
  public."gestao_marcenaria__tenants",
  public."gestao_marcenaria__tenant_membros",
  public."gestao_marcenaria__projetos_obras",
  public."gestao_marcenaria__movimentacoes_financeiras",
  public."gestao_marcenaria__contas_a_pagar",
  public."gestao_marcenaria__contas_a_receber",
  public."gestao_marcenaria__notas_fiscais",
  public."gestao_marcenaria__clientes",
  public."gestao_marcenaria__usuarios"
to authenticated;

-- TENANTS: só enxerga tenants em que é membro
drop policy if exists gm_tenants_select on public."gestao_marcenaria__tenants";
create policy gm_tenants_select
on public."gestao_marcenaria__tenants"
for select
to authenticated
using (public.gestao_marcenaria_user_in_tenant(id));

-- TENANT_MEMBROS: usuário enxerga seus vínculos
drop policy if exists gm_tenant_membros_select on public."gestao_marcenaria__tenant_membros";
create policy gm_tenant_membros_select
on public."gestao_marcenaria__tenant_membros"
for select
to authenticated
using (user_id = auth.uid());

-- Permite inserir vínculo apenas via função (security definer) -> não precisamos policy de insert aqui

-- Políticas padrão por tabela de dados:
-- Select: somente rows do tenant do usuário
-- Insert/Update/Delete: somente se usuário pertence ao tenant_id informado
create or replace function public.gestao_marcenaria_apply_policies(p_table regclass)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- placeholder (não executamos dinamicamente aqui; mantemos policies explícitas)
end;
$$;

-- Projetos
drop policy if exists gm_projetos_select on public."gestao_marcenaria__projetos_obras";
create policy gm_projetos_select
on public."gestao_marcenaria__projetos_obras"
for select to authenticated
using (public.gestao_marcenaria_user_in_tenant(tenant_id));

drop policy if exists gm_projetos_write on public."gestao_marcenaria__projetos_obras";
create policy gm_projetos_write
on public."gestao_marcenaria__projetos_obras"
for all to authenticated
using (public.gestao_marcenaria_user_in_tenant(tenant_id))
with check (public.gestao_marcenaria_user_in_tenant(tenant_id));

-- Movimentações
drop policy if exists gm_mov_select on public."gestao_marcenaria__movimentacoes_financeiras";
create policy gm_mov_select
on public."gestao_marcenaria__movimentacoes_financeiras"
for select to authenticated
using (public.gestao_marcenaria_user_in_tenant(tenant_id));

drop policy if exists gm_mov_write on public."gestao_marcenaria__movimentacoes_financeiras";
create policy gm_mov_write
on public."gestao_marcenaria__movimentacoes_financeiras"
for all to authenticated
using (public.gestao_marcenaria_user_in_tenant(tenant_id))
with check (public.gestao_marcenaria_user_in_tenant(tenant_id));

-- Contas a pagar
drop policy if exists gm_cp_select on public."gestao_marcenaria__contas_a_pagar";
create policy gm_cp_select
on public."gestao_marcenaria__contas_a_pagar"
for select to authenticated
using (public.gestao_marcenaria_user_in_tenant(tenant_id));

drop policy if exists gm_cp_write on public."gestao_marcenaria__contas_a_pagar";
create policy gm_cp_write
on public."gestao_marcenaria__contas_a_pagar"
for all to authenticated
using (public.gestao_marcenaria_user_in_tenant(tenant_id))
with check (public.gestao_marcenaria_user_in_tenant(tenant_id));

-- Contas a receber
drop policy if exists gm_cr_select on public."gestao_marcenaria__contas_a_receber";
create policy gm_cr_select
on public."gestao_marcenaria__contas_a_receber"
for select to authenticated
using (public.gestao_marcenaria_user_in_tenant(tenant_id));

drop policy if exists gm_cr_write on public."gestao_marcenaria__contas_a_receber";
create policy gm_cr_write
on public."gestao_marcenaria__contas_a_receber"
for all to authenticated
using (public.gestao_marcenaria_user_in_tenant(tenant_id))
with check (public.gestao_marcenaria_user_in_tenant(tenant_id));

-- Notas fiscais
drop policy if exists gm_nf_select on public."gestao_marcenaria__notas_fiscais";
create policy gm_nf_select
on public."gestao_marcenaria__notas_fiscais"
for select to authenticated
using (public.gestao_marcenaria_user_in_tenant(tenant_id));

drop policy if exists gm_nf_write on public."gestao_marcenaria__notas_fiscais";
create policy gm_nf_write
on public."gestao_marcenaria__notas_fiscais"
for all to authenticated
using (public.gestao_marcenaria_user_in_tenant(tenant_id))
with check (public.gestao_marcenaria_user_in_tenant(tenant_id));

-- Clientes
drop policy if exists gm_clientes_select on public."gestao_marcenaria__clientes";
create policy gm_clientes_select
on public."gestao_marcenaria__clientes"
for select to authenticated
using (public.gestao_marcenaria_user_in_tenant(tenant_id));

drop policy if exists gm_clientes_write on public."gestao_marcenaria__clientes";
create policy gm_clientes_write
on public."gestao_marcenaria__clientes"
for all to authenticated
using (public.gestao_marcenaria_user_in_tenant(tenant_id))
with check (public.gestao_marcenaria_user_in_tenant(tenant_id));

-- Usuários (perfil): cada usuário vê/edita somente o próprio perfil
drop policy if exists gm_usuarios_select on public."gestao_marcenaria__usuarios";
create policy gm_usuarios_select
on public."gestao_marcenaria__usuarios"
for select to authenticated
using (user_id = auth.uid());

drop policy if exists gm_usuarios_update on public."gestao_marcenaria__usuarios";
create policy gm_usuarios_update
on public."gestao_marcenaria__usuarios"
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ==========================================================
-- 3.2) Rate limit de cadastro (anti-abuso)
-- ==========================================================
create table if not exists public."gestao_marcenaria__rate_limit_signup" (
  id bigserial primary key,
  ip_hash text not null,
  window_start timestamptz not null,
  count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ip_hash, window_start)
);

comment on table public."gestao_marcenaria__rate_limit_signup" is 'Gestão de Marcenaria - Rate limit para endpoint de cadastro';

drop trigger if exists gm_set_updated_at_rate_limit_signup on public."gestao_marcenaria__rate_limit_signup";
create trigger gm_set_updated_at_rate_limit_signup
before update on public."gestao_marcenaria__rate_limit_signup"
for each row execute function public.gestao_marcenaria_set_updated_at();

create index if not exists idx_gm_rl_signup_window
  on public."gestao_marcenaria__rate_limit_signup"(window_start desc);

-- ==========================================================
-- 3.3) Rate limit GLOBAL (automático) para escritas no banco
-- ==========================================================
-- Observação importante:
-- - Este rate limit é aplicado em INSERT/UPDATE/DELETE (triggers).
-- - SELECT (leitura) não dispara trigger; para leitura, use RLS + limites da plataforma.

create table if not exists public."gestao_marcenaria__rate_limit_ops" (
  actor_id uuid not null,
  op_key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (actor_id, op_key, window_start)
);

comment on table public."gestao_marcenaria__rate_limit_ops" is 'Gestão de Marcenaria - Rate limit global (operações de escrita)';

drop trigger if exists gm_set_updated_at_rate_limit_ops on public."gestao_marcenaria__rate_limit_ops";
create trigger gm_set_updated_at_rate_limit_ops
before update on public."gestao_marcenaria__rate_limit_ops"
for each row execute function public.gestao_marcenaria_set_updated_at();

create index if not exists idx_gm_rl_ops_window
  on public."gestao_marcenaria__rate_limit_ops"(window_start desc);

-- Função genérica de rate limit por usuário (auth.uid)
create or replace function public.gestao_marcenaria_rate_limit_op(
  p_op_key text,
  p_max int,
  p_window_sec int
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor uuid;
  v_window_start timestamptz;
  v_current int;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_sec) * p_window_sec);

  insert into public."gestao_marcenaria__rate_limit_ops"(actor_id, op_key, window_start, count)
  values (v_actor, p_op_key, v_window_start, 0)
  on conflict (actor_id, op_key, window_start) do nothing;

  select count
    into v_current
  from public."gestao_marcenaria__rate_limit_ops"
  where actor_id = v_actor
    and op_key = p_op_key
    and window_start = v_window_start;

  if v_current >= p_max then
    raise exception 'Rate limit excedido para % (máx % em %s)', p_op_key, p_max, p_window_sec;
  end if;

  update public."gestao_marcenaria__rate_limit_ops"
  set count = v_current + 1
  where actor_id = v_actor
    and op_key = p_op_key
    and window_start = v_window_start;
end;
$$;

-- Trigger helper: define uma chave por tabela + operação
create or replace function public.gestao_marcenaria_rate_limit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_op text;
begin
  -- Limites recomendados para baixo tráfego:
  -- - Escritas: 60 por minuto por usuário
  -- - Deletes: 20 por minuto por usuário
  v_op := format('%s.%s', tg_table_name, lower(tg_op));

  if tg_op = 'DELETE' then
    perform public.gestao_marcenaria_rate_limit_op(v_op, 20, 60);
  else
    perform public.gestao_marcenaria_rate_limit_op(v_op, 60, 60);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Aplica triggers nas tabelas principais do sistema
drop trigger if exists gm_rl_projetos on public."gestao_marcenaria__projetos_obras";
create trigger gm_rl_projetos
before insert or update or delete on public."gestao_marcenaria__projetos_obras"
for each row execute function public.gestao_marcenaria_rate_limit_trigger();

drop trigger if exists gm_rl_movimentacoes on public."gestao_marcenaria__movimentacoes_financeiras";
create trigger gm_rl_movimentacoes
before insert or update or delete on public."gestao_marcenaria__movimentacoes_financeiras"
for each row execute function public.gestao_marcenaria_rate_limit_trigger();

drop trigger if exists gm_rl_contas_pagar on public."gestao_marcenaria__contas_a_pagar";
create trigger gm_rl_contas_pagar
before insert or update or delete on public."gestao_marcenaria__contas_a_pagar"
for each row execute function public.gestao_marcenaria_rate_limit_trigger();

drop trigger if exists gm_rl_contas_receber on public."gestao_marcenaria__contas_a_receber";
create trigger gm_rl_contas_receber
before insert or update or delete on public."gestao_marcenaria__contas_a_receber"
for each row execute function public.gestao_marcenaria_rate_limit_trigger();

drop trigger if exists gm_rl_notas_fiscais on public."gestao_marcenaria__notas_fiscais";
create trigger gm_rl_notas_fiscais
before insert or update or delete on public."gestao_marcenaria__notas_fiscais"
for each row execute function public.gestao_marcenaria_rate_limit_trigger();

drop trigger if exists gm_rl_clientes on public."gestao_marcenaria__clientes";
create trigger gm_rl_clientes
before insert or update or delete on public."gestao_marcenaria__clientes"
for each row execute function public.gestao_marcenaria_rate_limit_trigger();

-- ==========================================================
-- 5) Migração de dados existentes (opcional)
-- ==========================================================
-- Se você já tem dados nas tabelas antigas, crie um tenant "Padrão" e atribua:
--   select public.gestao_marcenaria_onboard_tenant('Padrão');  -- (rodar logado) OU crie manualmente como service role.
-- Depois faça update das tabelas para tenant_id e por fim torne tenant_id NOT NULL.


