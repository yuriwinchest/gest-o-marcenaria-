'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';
import { formatCurrency, calculateFluxoCaixa, calculateDRE, calculateProjetoLucro, getMonthRange } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import type { ContaPagar, ContaReceber, Movimentacao, Projeto } from '@/types';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { TABLES } from '@/lib/db/tables';
import { mapContaPagarFromDb, mapContaReceberFromDb, mapMovimentacaoFromDb, mapProjetoFromDb, type DbContaPagar, type DbContaReceber, type DbMovimentacao, type DbProjeto } from '@/lib/db/mappers';

export default function RelatoriosPage() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedProjeto, setSelectedProjeto] = useState<string>('');

  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const supabase = getSupabaseBrowser();

      const monthDate = new Date(selectedMonth + '-01');
      const { start, end } = getMonthRange(monthDate);
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      const [mQ, cpQ, crQ, pQ] = await Promise.all([
        supabase.from(TABLES.movimentacoes).select('*').gte('data', startStr).lte('data', endStr),
        supabase.from(TABLES.contasPagar).select('*').gte('data_vencimento', startStr).lte('data_vencimento', endStr),
        supabase.from(TABLES.contasReceber).select('*').gte('data_vencimento', startStr).lte('data_vencimento', endStr),
        supabase.from(TABLES.projetos).select('*').order('created_at', { ascending: false }),
      ]);

      if (mQ.error) throw mQ.error;
      if (cpQ.error) throw cpQ.error;
      if (crQ.error) throw crQ.error;
      if (pQ.error) throw pQ.error;

      setMovimentacoes(((mQ.data ?? []) as DbMovimentacao[]).map(mapMovimentacaoFromDb));
      setContasPagar(((cpQ.data ?? []) as DbContaPagar[]).map(mapContaPagarFromDb));
      setContasReceber(((crQ.data ?? []) as DbContaReceber[]).map(mapContaReceberFromDb));
      setProjetos(((pQ.data ?? []) as DbProjeto[]).map(mapProjetoFromDb));
    };
    loadData();
  }, [selectedMonth]);

  const monthDate = new Date(selectedMonth + '-01');
  const monthRange = getMonthRange(monthDate);

  const fluxoCaixa = calculateFluxoCaixa(movimentacoes, contasPagar, contasReceber, monthRange.start, monthRange.end);
  const dre = calculateDRE(movimentacoes, contasPagar, contasReceber, monthRange.start, monthRange.end);

  const projetosComLucro = projetos
    .map(projeto => {
      const lucro = calculateProjetoLucro(projeto.id, movimentacoes, contasPagar, contasReceber);
      return { ...projeto, ...lucro };
    })
    .filter(p => p.receitas > 0 || p.despesas > 0);

  const projetoSelecionado = selectedProjeto ? projetosComLucro.find(p => p.id === selectedProjeto) : null;

  return (
    <div className="min-h-screen">
      <header className="gm-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link href="/" className="gm-text-muted hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Relatórios Financeiros</h1>
              <p className="mt-1 gm-text-muted">Análise financeira e relatórios consolidados</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filtros */}
        <div className="gm-surface rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium gm-text-muted mb-1">Mês</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-lg px-3 py-2 gm-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium gm-text-muted mb-1">Projeto (para relatório detalhado)</label>
              <select
                value={selectedProjeto}
                onChange={(e) => setSelectedProjeto(e.target.value)}
                className="w-full rounded-lg px-3 py-2 gm-select"
              >
                <option value="">Todos os projetos</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Resumo Mensal */}
        <div className="gm-surface rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <FileText className="w-6 h-6" />
            <span>Resumo Mensal - {format(monthDate, 'MMMM yyyy', { locale: ptBR })}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Total de Entradas</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(fluxoCaixa.entradas)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">Total de Saídas</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(fluxoCaixa.saidas)}</p>
            </div>
            <div className={`rounded-lg p-4 ${fluxoCaixa.saldo >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className={`w-5 h-5 ${fluxoCaixa.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                <span className={`text-sm font-medium ${fluxoCaixa.saldo >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>Saldo do Mês</span>
              </div>
              <p className={`text-2xl font-bold ${fluxoCaixa.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatCurrency(fluxoCaixa.saldo)}
              </p>
            </div>
          </div>
        </div>

        {/* Fluxo de Caixa */}
        <div className="gm-surface rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Fluxo de Caixa</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium">Entradas</span>
              <span className="text-green-600 font-semibold">{formatCurrency(fluxoCaixa.entradas)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium">Saídas</span>
              <span className="text-red-600 font-semibold">{formatCurrency(fluxoCaixa.saidas)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <span className="font-semibold">Saldo Líquido</span>
              <span className={`font-bold text-lg ${fluxoCaixa.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(fluxoCaixa.saldo)}
              </span>
            </div>
          </div>
        </div>

        {/* DRE - Demonstração do Resultado do Exercício */}
        <div className="gm-surface rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">DRE - Demonstração do Resultado do Exercício</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <span className="font-medium">Receitas</span>
              <span className="text-green-600 font-semibold">{formatCurrency(dre.receitas)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
              <span className="font-medium">Despesas</span>
              <span className="text-red-600 font-semibold">{formatCurrency(dre.despesas)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <span className="font-semibold">Lucro Líquido</span>
              <span className={`font-bold text-lg ${dre.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(dre.lucro)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium">Margem de Lucro</span>
              <span className={`font-semibold ${dre.margem >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dre.margem.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Lucro por Projeto */}
        <div className="gm-surface rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Lucro e Despesas por Projeto</h2>
          {projetosComLucro.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhum projeto com movimentações financeiras</p>
          ) : (
            <div className="space-y-4">
              {projetosComLucro.map((projeto) => (
                <div key={projeto.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{projeto.nome}</h3>
                      <p className="text-sm text-gray-500">{projeto.descricao || 'Sem descrição'}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      projeto.status === 'ativo' ? 'bg-blue-100 text-blue-800' :
                      projeto.status === 'concluido' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {projeto.status === 'ativo' ? 'Ativo' : projeto.status === 'concluido' ? 'Concluído' : 'Cancelado'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Receitas</span>
                      <p className="text-lg font-semibold text-green-600">{formatCurrency(projeto.receitas)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Despesas</span>
                      <p className="text-lg font-semibold text-red-600">{formatCurrency(projeto.despesas)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Lucro</span>
                      <p className={`text-lg font-semibold ${projeto.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(projeto.lucro)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Margem</span>
                      <p className={`text-lg font-semibold ${projeto.margem >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {projeto.margem.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Relatório Detalhado por Projeto */}
        {projetoSelecionado && (
        <div className="gm-surface rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Relatório Detalhado - {projetoSelecionado.nome}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <span className="text-sm font-medium text-green-800">Receitas Totais</span>
                  <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(projetoSelecionado.receitas)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <span className="text-sm font-medium text-red-800">Despesas Totais</span>
                  <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(projetoSelecionado.despesas)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <span className="text-sm font-medium text-blue-800">Lucro Líquido</span>
                  <p className={`text-2xl font-bold mt-2 ${projetoSelecionado.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(projetoSelecionado.lucro)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <span className="text-sm font-medium text-purple-800">Margem de Lucro</span>
                  <p className={`text-2xl font-bold mt-2 ${projetoSelecionado.margem >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {projetoSelecionado.margem.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

