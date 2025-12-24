import type { ContaPagar, ContaReceber, Movimentacao, NotaFiscal, Projeto } from '@/types';

export type DbProjeto = {
  id: string;
  tenant_id?: string | null;
  nome: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  status: 'ativo' | 'concluido' | 'cancelado';
  created_at: string;
};

export function mapProjetoFromDb(r: DbProjeto): Projeto {
  return {
    id: r.id,
    nome: r.nome,
    descricao: r.descricao ?? undefined,
    dataInicio: r.data_inicio,
    dataFim: r.data_fim ?? undefined,
    status: r.status,
    createdAt: r.created_at,
  };
}

export function mapProjetoToDb(p: Partial<Projeto>): Partial<DbProjeto> {
  return {
    id: p.id,
    nome: p.nome,
    descricao: p.descricao ?? null,
    data_inicio: p.dataInicio,
    data_fim: p.dataFim ?? null,
    status: p.status,
    // created_at managed by DB
  };
}

export type DbMovimentacao = {
  id: string;
  tenant_id?: string | null;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  projeto_id: string | null;
  observacoes: string | null;
  created_at: string;
};

export function mapMovimentacaoFromDb(r: DbMovimentacao): Movimentacao {
  return {
    id: r.id,
    tipo: r.tipo,
    descricao: r.descricao,
    valor: Number(r.valor),
    data: r.data,
    categoria: r.categoria,
    projetoId: r.projeto_id ?? undefined,
    observacoes: r.observacoes ?? undefined,
    createdAt: r.created_at,
  };
}

export function mapMovimentacaoToDb(m: Partial<Movimentacao>): Partial<DbMovimentacao> {
  return {
    id: m.id,
    tipo: m.tipo,
    descricao: m.descricao,
    valor: m.valor,
    data: m.data,
    categoria: m.categoria,
    projeto_id: m.projetoId ?? null,
    observacoes: m.observacoes ?? null,
  };
}

export type DbContaPagar = {
  id: string;
  tenant_id?: string | null;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: 'pendente' | 'paga' | 'vencida';
  fornecedor: string;
  categoria: string;
  projeto_id: string | null;
  observacoes: string | null;
  created_at: string;
};

export function mapContaPagarFromDb(r: DbContaPagar): ContaPagar {
  return {
    id: r.id,
    descricao: r.descricao,
    valor: Number(r.valor),
    dataVencimento: r.data_vencimento,
    dataPagamento: r.data_pagamento ?? undefined,
    status: r.status,
    fornecedor: r.fornecedor,
    categoria: r.categoria,
    projetoId: r.projeto_id ?? undefined,
    observacoes: r.observacoes ?? undefined,
    createdAt: r.created_at,
  };
}

export function mapContaPagarToDb(c: Partial<ContaPagar>): Partial<DbContaPagar> {
  return {
    id: c.id,
    descricao: c.descricao,
    valor: c.valor,
    data_vencimento: c.dataVencimento,
    data_pagamento: c.dataPagamento ?? null,
    status: c.status as any,
    fornecedor: c.fornecedor,
    categoria: c.categoria,
    projeto_id: c.projetoId ?? null,
    observacoes: c.observacoes ?? null,
  };
}

export type DbContaReceber = {
  id: string;
  tenant_id?: string | null;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_recebimento: string | null;
  status: 'pendente' | 'recebida' | 'vencida';
  cliente: string;
  categoria: string;
  projeto_id: string | null;
  observacoes: string | null;
  created_at: string;
};

export function mapContaReceberFromDb(r: DbContaReceber): ContaReceber {
  return {
    id: r.id,
    descricao: r.descricao,
    valor: Number(r.valor),
    dataVencimento: r.data_vencimento,
    dataRecebimento: r.data_recebimento ?? undefined,
    status: r.status as any,
    cliente: r.cliente,
    categoria: r.categoria,
    projetoId: r.projeto_id ?? undefined,
    observacoes: r.observacoes ?? undefined,
    createdAt: r.created_at,
  };
}

export function mapContaReceberToDb(c: Partial<ContaReceber>): Partial<DbContaReceber> {
  return {
    id: c.id,
    descricao: c.descricao,
    valor: c.valor,
    data_vencimento: c.dataVencimento,
    data_recebimento: c.dataRecebimento ?? null,
    status: c.status as any,
    cliente: c.cliente,
    categoria: c.categoria,
    projeto_id: c.projetoId ?? null,
    observacoes: c.observacoes ?? null,
  };
}

export type DbNotaFiscal = {
  id: string;
  tenant_id?: string | null;
  numero: string;
  serie: string | null;
  tipo: 'entrada' | 'saida';
  data_emissao: string;
  valor: number;
  cliente_fornecedor: string;
  projeto_id: string | null;
  observacoes: string | null;
  created_at: string;
};

export function mapNotaFiscalFromDb(r: DbNotaFiscal): NotaFiscal {
  return {
    id: r.id,
    numero: r.numero,
    serie: r.serie ?? undefined,
    tipo: r.tipo,
    dataEmissao: r.data_emissao,
    valor: Number(r.valor),
    clienteFornecedor: r.cliente_fornecedor,
    projetoId: r.projeto_id ?? undefined,
    observacoes: r.observacoes ?? undefined,
    createdAt: r.created_at,
  };
}

export function mapNotaFiscalToDb(n: Partial<NotaFiscal>): Partial<DbNotaFiscal> {
  return {
    id: n.id,
    numero: n.numero,
    serie: n.serie ?? null,
    tipo: n.tipo,
    data_emissao: n.dataEmissao,
    valor: n.valor,
    cliente_fornecedor: n.clienteFornecedor,
    projeto_id: n.projetoId ?? null,
    observacoes: n.observacoes ?? null,
  };
}


