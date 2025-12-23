import { Movimentacao, ContaPagar, ContaReceber, Projeto, NotaFiscal } from '@/types';

const STORAGE_KEYS = {
  movimentacoes: 'gestao_marcenaria_movimentacoes',
  contasPagar: 'gestao_marcenaria_contas_pagar',
  contasReceber: 'gestao_marcenaria_contas_receber',
  projetos: 'gestao_marcenaria_projetos',
  notasFiscais: 'gestao_marcenaria_notas_fiscais',
};

export const storageService = {
  // Movimentações
  getMovimentacoes: (): Movimentacao[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.movimentacoes);
    return data ? JSON.parse(data) : [];
  },

  saveMovimentacao: (movimentacao: Movimentacao): void => {
    if (typeof window === 'undefined') return;
    const movimentacoes = storageService.getMovimentacoes();
    movimentacoes.push(movimentacao);
    localStorage.setItem(STORAGE_KEYS.movimentacoes, JSON.stringify(movimentacoes));
  },

  updateMovimentacao: (id: string, movimentacao: Partial<Movimentacao>): void => {
    if (typeof window === 'undefined') return;
    const movimentacoes = storageService.getMovimentacoes();
    const index = movimentacoes.findIndex(m => m.id === id);
    if (index !== -1) {
      movimentacoes[index] = { ...movimentacoes[index], ...movimentacao };
      localStorage.setItem(STORAGE_KEYS.movimentacoes, JSON.stringify(movimentacoes));
    }
  },

  deleteMovimentacao: (id: string): void => {
    if (typeof window === 'undefined') return;
    const movimentacoes = storageService.getMovimentacoes().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.movimentacoes, JSON.stringify(movimentacoes));
  },

  // Contas a Pagar
  getContasPagar: (): ContaPagar[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.contasPagar);
    return data ? JSON.parse(data) : [];
  },

  saveContaPagar: (conta: ContaPagar): void => {
    if (typeof window === 'undefined') return;
    const contas = storageService.getContasPagar();
    contas.push(conta);
    localStorage.setItem(STORAGE_KEYS.contasPagar, JSON.stringify(contas));
  },

  updateContaPagar: (id: string, conta: Partial<ContaPagar>): void => {
    if (typeof window === 'undefined') return;
    const contas = storageService.getContasPagar();
    const index = contas.findIndex(c => c.id === id);
    if (index !== -1) {
      contas[index] = { ...contas[index], ...conta };
      localStorage.setItem(STORAGE_KEYS.contasPagar, JSON.stringify(contas));
    }
  },

  deleteContaPagar: (id: string): void => {
    if (typeof window === 'undefined') return;
    const contas = storageService.getContasPagar().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.contasPagar, JSON.stringify(contas));
  },

  // Contas a Receber
  getContasReceber: (): ContaReceber[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.contasReceber);
    return data ? JSON.parse(data) : [];
  },

  saveContaReceber: (conta: ContaReceber): void => {
    if (typeof window === 'undefined') return;
    const contas = storageService.getContasReceber();
    contas.push(conta);
    localStorage.setItem(STORAGE_KEYS.contasReceber, JSON.stringify(contas));
  },

  updateContaReceber: (id: string, conta: Partial<ContaReceber>): void => {
    if (typeof window === 'undefined') return;
    const contas = storageService.getContasReceber();
    const index = contas.findIndex(c => c.id === id);
    if (index !== -1) {
      contas[index] = { ...contas[index], ...conta };
      localStorage.setItem(STORAGE_KEYS.contasReceber, JSON.stringify(contas));
    }
  },

  deleteContaReceber: (id: string): void => {
    if (typeof window === 'undefined') return;
    const contas = storageService.getContasReceber().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.contasReceber, JSON.stringify(contas));
  },

  // Projetos
  getProjetos: (): Projeto[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.projetos);
    return data ? JSON.parse(data) : [];
  },

  saveProjeto: (projeto: Projeto): void => {
    if (typeof window === 'undefined') return;
    const projetos = storageService.getProjetos();
    projetos.push(projeto);
    localStorage.setItem(STORAGE_KEYS.projetos, JSON.stringify(projetos));
  },

  updateProjeto: (id: string, projeto: Partial<Projeto>): void => {
    if (typeof window === 'undefined') return;
    const projetos = storageService.getProjetos();
    const index = projetos.findIndex(p => p.id === id);
    if (index !== -1) {
      projetos[index] = { ...projetos[index], ...projeto };
      localStorage.setItem(STORAGE_KEYS.projetos, JSON.stringify(projetos));
    }
  },

  deleteProjeto: (id: string): void => {
    if (typeof window === 'undefined') return;
    const projetos = storageService.getProjetos().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.projetos, JSON.stringify(projetos));
  },

  // Notas Fiscais
  getNotasFiscais: (): NotaFiscal[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.notasFiscais);
    return data ? JSON.parse(data) : [];
  },

  saveNotaFiscal: (nota: NotaFiscal): void => {
    if (typeof window === 'undefined') return;
    const notas = storageService.getNotasFiscais();
    notas.push(nota);
    localStorage.setItem(STORAGE_KEYS.notasFiscais, JSON.stringify(notas));
  },

  updateNotaFiscal: (id: string, nota: Partial<NotaFiscal>): void => {
    if (typeof window === 'undefined') return;
    const notas = storageService.getNotasFiscais();
    const index = notas.findIndex(n => n.id === id);
    if (index !== -1) {
      notas[index] = { ...notas[index], ...nota };
      localStorage.setItem(STORAGE_KEYS.notasFiscais, JSON.stringify(notas));
    }
  },

  deleteNotaFiscal: (id: string): void => {
    if (typeof window === 'undefined') return;
    const notas = storageService.getNotasFiscais().filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.notasFiscais, JSON.stringify(notas));
  },
};

