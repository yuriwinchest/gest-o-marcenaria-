import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Movimentacao, ContaPagar, ContaReceber, Projeto } from '@/types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
};

export const formatDateInput = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
};

export const getMonthRange = (date: Date) => {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
};

export const calculateFluxoCaixa = (
  movimentacoes: Movimentacao[],
  contasPagar: ContaPagar[],
  contasReceber: ContaReceber[],
  startDate: Date,
  endDate: Date
) => {
  const interval = { start: startDate, end: endDate };
  
  const entradas = movimentacoes
    .filter(m => m.tipo === 'entrada' && isWithinInterval(parseISO(m.data), interval))
    .reduce((sum, m) => sum + m.valor, 0);

  const saidas = movimentacoes
    .filter(m => m.tipo === 'saida' && isWithinInterval(parseISO(m.data), interval))
    .reduce((sum, m) => sum + m.valor, 0);

  const contasPagarPagas = contasPagar
    .filter(c => c.status === 'paga' && c.dataPagamento && isWithinInterval(parseISO(c.dataPagamento), interval))
    .reduce((sum, c) => sum + c.valor, 0);

  const contasReceberRecebidas = contasReceber
    .filter(c => c.status === 'recebida' && c.dataRecebimento && isWithinInterval(parseISO(c.dataRecebimento), interval))
    .reduce((sum, c) => sum + c.valor, 0);

  const totalEntradas = entradas + contasReceberRecebidas;
  const totalSaidas = saidas + contasPagarPagas;
  const saldo = totalEntradas - totalSaidas;

  return {
    entradas: totalEntradas,
    saidas: totalSaidas,
    saldo,
  };
};

export const calculateDRE = (
  movimentacoes: Movimentacao[],
  contasPagar: ContaPagar[],
  contasReceber: ContaReceber[],
  startDate: Date,
  endDate: Date
) => {
  const interval = { start: startDate, end: endDate };

  const receitas = [
    ...movimentacoes.filter(m => m.tipo === 'entrada' && isWithinInterval(parseISO(m.data), interval)),
    ...contasReceber.filter(c => c.status === 'recebida' && c.dataRecebimento && isWithinInterval(parseISO(c.dataRecebimento), interval)),
  ].reduce((sum, item) => sum + item.valor, 0);

  const despesas = [
    ...movimentacoes.filter(m => m.tipo === 'saida' && isWithinInterval(parseISO(m.data), interval)),
    ...contasPagar.filter(c => c.status === 'paga' && c.dataPagamento && isWithinInterval(parseISO(c.dataPagamento), interval)),
  ].reduce((sum, item) => sum + item.valor, 0);

  const lucro = receitas - despesas;
  const margem = receitas > 0 ? (lucro / receitas) * 100 : 0;

  return {
    receitas,
    despesas,
    lucro,
    margem,
  };
};

export const calculateProjetoLucro = (
  projetoId: string,
  movimentacoes: Movimentacao[],
  contasPagar: ContaPagar[],
  contasReceber: ContaReceber[]
) => {
  const receitas = [
    ...movimentacoes.filter(m => m.tipo === 'entrada' && m.projetoId === projetoId),
    ...contasReceber.filter(c => c.projetoId === projetoId && c.status === 'recebida'),
  ].reduce((sum, item) => sum + item.valor, 0);

  const despesas = [
    ...movimentacoes.filter(m => m.tipo === 'saida' && m.projetoId === projetoId),
    ...contasPagar.filter(c => c.projetoId === projetoId && c.status === 'paga'),
  ].reduce((sum, item) => sum + item.valor, 0);

  const lucro = receitas - despesas;
  const margem = receitas > 0 ? (lucro / receitas) * 100 : 0;

  return {
    receitas,
    despesas,
    lucro,
    margem,
  };
};

