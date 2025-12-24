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
-- 5) Migração de dados existentes (opcional)
-- ==========================================================
-- Se você já tem dados nas tabelas antigas, crie um tenant "Padrão" e atribua:
--   select public.gestao_marcenaria_onboard_tenant('Padrão');  -- (rodar logado) OU crie manualmente como service role.
-- Depois faça update das tabelas para tenant_id e por fim torne tenant_id NOT NULL.


