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

export interface Tenant {
  id: string;
  nome: string;
  createdAt: string;
}

export type TipoPessoa = 'pf' | 'pj';

export interface Cliente {
  id: string;
  nome: string;
  tipoPessoa: TipoPessoa;
  razaoSocial?: string;
  nomeFantasia?: string;
  cpfCnpj?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  email?: string;
  telefone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  pais?: string;
  observacoes?: string;
  createdAt: string;
}

