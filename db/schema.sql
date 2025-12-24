-- Gestão de Marcenaria - Schema (Supabase/Postgres)
-- Objetivo: Uma tabela por página, com nomes em português e prefixo do projeto para identificação.
-- Como usar: cole/rode este arquivo no SQL Editor do Supabase (Database → SQL Editor).

create extension if not exists "pgcrypto";

-- =========================
-- Projetos / Obras
-- =========================
create table if not exists public."gestao_marcenaria__projetos_obras" (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  data_inicio date not null,
  data_fim date,
  status text not null default 'ativo' check (status in ('ativo','concluido','cancelado')),
  created_at timestamptz not null default now()
);

comment on table public."gestao_marcenaria__projetos_obras" is 'Gestão de Marcenaria - Projetos/Obras';

create index if not exists idx_gm_projetos_obras_status
  on public."gestao_marcenaria__projetos_obras"(status);

create index if not exists idx_gm_projetos_obras_created_at
  on public."gestao_marcenaria__projetos_obras"(created_at desc);

-- =========================
-- Movimentações Financeiras
-- =========================
create table if not exists public."gestao_marcenaria__movimentacoes_financeiras" (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('entrada','saida')),
  descricao text not null,
  valor numeric(14,2) not null check (valor >= 0),
  data date not null,
  categoria text not null,
  projeto_id uuid references public."gestao_marcenaria__projetos_obras"(id) on delete set null,
  observacoes text,
  created_at timestamptz not null default now()
);

comment on table public."gestao_marcenaria__movimentacoes_financeiras" is 'Gestão de Marcenaria - Movimentações Financeiras';

create index if not exists idx_gm_mov_data
  on public."gestao_marcenaria__movimentacoes_financeiras"(data desc);

create index if not exists idx_gm_mov_tipo
  on public."gestao_marcenaria__movimentacoes_financeiras"(tipo);

create index if not exists idx_gm_mov_projeto
  on public."gestao_marcenaria__movimentacoes_financeiras"(projeto_id);

-- =========================
-- Contas a Pagar
-- =========================
create table if not exists public."gestao_marcenaria__contas_a_pagar" (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor numeric(14,2) not null check (valor >= 0),
  data_vencimento date not null,
  data_pagamento date,
  status text not null default 'pendente' check (status in ('pendente','paga','vencida')),
  fornecedor text not null,
  categoria text not null,
  projeto_id uuid references public."gestao_marcenaria__projetos_obras"(id) on delete set null,
  observacoes text,
  created_at timestamptz not null default now()
);

comment on table public."gestao_marcenaria__contas_a_pagar" is 'Gestão de Marcenaria - Contas a Pagar';

create index if not exists idx_gm_cp_vencimento
  on public."gestao_marcenaria__contas_a_pagar"(data_vencimento asc);

create index if not exists idx_gm_cp_status
  on public."gestao_marcenaria__contas_a_pagar"(status);

create index if not exists idx_gm_cp_projeto
  on public."gestao_marcenaria__contas_a_pagar"(projeto_id);

-- =========================
-- Contas a Receber
-- =========================
create table if not exists public."gestao_marcenaria__contas_a_receber" (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor numeric(14,2) not null check (valor >= 0),
  data_vencimento date not null,
  data_recebimento date,
  status text not null default 'pendente' check (status in ('pendente','recebida','vencida')),
  cliente text not null,
  categoria text not null,
  projeto_id uuid references public."gestao_marcenaria__projetos_obras"(id) on delete set null,
  observacoes text,
  created_at timestamptz not null default now()
);

comment on table public."gestao_marcenaria__contas_a_receber" is 'Gestão de Marcenaria - Contas a Receber';

create index if not exists idx_gm_cr_vencimento
  on public."gestao_marcenaria__contas_a_receber"(data_vencimento asc);

create index if not exists idx_gm_cr_status
  on public."gestao_marcenaria__contas_a_receber"(status);

create index if not exists idx_gm_cr_projeto
  on public."gestao_marcenaria__contas_a_receber"(projeto_id);

-- =========================
-- Notas Fiscais
-- =========================
create table if not exists public."gestao_marcenaria__notas_fiscais" (
  id uuid primary key default gen_random_uuid(),
  numero text not null,
  serie text,
  tipo text not null check (tipo in ('entrada','saida')),
  data_emissao date not null,
  valor numeric(14,2) not null check (valor >= 0),
  cliente_fornecedor text not null,
  projeto_id uuid references public."gestao_marcenaria__projetos_obras"(id) on delete set null,
  observacoes text,
  created_at timestamptz not null default now()
);

comment on table public."gestao_marcenaria__notas_fiscais" is 'Gestão de Marcenaria - Notas Fiscais';

create index if not exists idx_gm_nf_emissao
  on public."gestao_marcenaria__notas_fiscais"(data_emissao desc);

create index if not exists idx_gm_nf_projeto
  on public."gestao_marcenaria__notas_fiscais"(projeto_id);


