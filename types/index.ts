export type TipoMovimentacao = 'entrada' | 'saida';
export type StatusConta = 'pendente' | 'paga' | 'recebida' | 'vencida';

export interface Movimentacao {
  id: string;
  tipo: TipoMovimentacao;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  projetoId?: string;
  observacoes?: string;
  createdAt: string;
}

export interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: StatusConta;
  fornecedor: string;
  categoria: string;
  projetoId?: string;
  observacoes?: string;
  createdAt: string;
}

export interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataRecebimento?: string;
  status: StatusConta;
  cliente: string;
  categoria: string;
  projetoId?: string;
  observacoes?: string;
  createdAt: string;
}

export interface Projeto {
  id: string;
  nome: string;
  descricao?: string;
  dataInicio: string;
  dataFim?: string;
  status: 'ativo' | 'concluido' | 'cancelado';
  createdAt: string;
}

export interface NotaFiscal {
  id: string;
  numero: string;
  serie?: string;
  tipo: 'entrada' | 'saida';
  dataEmissao: string;
  valor: number;
  clienteFornecedor: string;
  projetoId?: string;
  observacoes?: string;
  createdAt: string;
}

