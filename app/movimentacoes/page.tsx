'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Movimentacao, Projeto, TipoMovimentacao } from '@/types';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { TABLES } from '@/lib/db/tables';
import { getTenantIdOrThrow } from '@/lib/tenant/getTenantId';
import { mapMovimentacaoFromDb, mapMovimentacaoToDb, mapProjetoFromDb, type DbMovimentacao, type DbProjeto } from '@/lib/db/mappers';

export default function MovimentacoesPage() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tipo: 'entrada' as TipoMovimentacao,
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    categoria: '',
    projetoId: '',
    observacoes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = getSupabaseBrowser();
    const [{ data: movData, error: movError }, { data: projData, error: projError }] = await Promise.all([
      supabase.from(TABLES.movimentacoes).select('*').order('data', { ascending: false }),
      supabase.from(TABLES.projetos).select('*').order('created_at', { ascending: false }),
    ]);
    if (movError) throw movError;
    if (projError) throw projError;
    setMovimentacoes(((movData ?? []) as DbMovimentacao[]).map(mapMovimentacaoFromDb));
    setProjetos(((projData ?? []) as DbProjeto[]).map(mapProjetoFromDb));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tenantId = await getTenantIdOrThrow();
    const supabase = getSupabaseBrowser();
    const movimentacao: Movimentacao = {
      id: editingId || crypto.randomUUID(),
      tipo: formData.tipo,
      descricao: formData.descricao,
      valor: parseFloat(formData.valor),
      data: formData.data,
      categoria: formData.categoria,
      projetoId: formData.projetoId || undefined,
      observacoes: formData.observacoes || undefined,
      createdAt: new Date().toISOString(),
    };

    const payload = { ...mapMovimentacaoToDb(movimentacao), tenant_id: tenantId };
    if (editingId) {
      const { error } = await supabase.from(TABLES.movimentacoes).update(payload).eq('id', editingId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from(TABLES.movimentacoes).insert(payload);
      if (error) throw error;
    }

    resetForm();
    await loadData();
  };

  const handleEdit = (movimentacao: Movimentacao) => {
    setEditingId(movimentacao.id);
    setFormData({
      tipo: movimentacao.tipo,
      descricao: movimentacao.descricao,
      valor: movimentacao.valor.toString(),
      data: movimentacao.data.split('T')[0],
      categoria: movimentacao.categoria,
      projetoId: movimentacao.projetoId || '',
      observacoes: movimentacao.observacoes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta movimentação?')) {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.from(TABLES.movimentacoes).delete().eq('id', id);
      if (error) throw error;
      await loadData();
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'entrada',
      descricao: '',
      valor: '',
      data: new Date().toISOString().split('T')[0],
      categoria: '',
      projetoId: '',
      observacoes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen">
      <header className="gm-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="gm-text-muted hover:text-white">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Movimentações Financeiras</h1>
                <p className="mt-1 gm-text-muted">Lançamento de entradas e saídas</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>{showForm ? 'Cancelar' : 'Nova Movimentação'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showForm && (
          <div className="gm-surface rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Editar Movimentação' : 'Nova Movimentação'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoMovimentacao })}
                    className="w-full rounded-lg px-3 py-2 gm-select"
                    required
                  >
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Data</label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 gm-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Descrição</label>
                  <input
                    type="text"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 gm-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 gm-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Categoria</label>
                  <input
                    type="text"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 gm-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Projeto (opcional)</label>
                  <select
                    value={formData.projetoId}
                    onChange={(e) => setFormData({ ...formData, projetoId: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 gm-select"
                  >
                    <option value="">Nenhum</option>
                    {projetos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium gm-text-muted mb-1">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 gm-textarea"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Atualizar' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-white/10 text-white px-6 py-2 rounded-lg hover:bg-white/15 border border-white/10"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="gm-surface rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 gm-table">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Projeto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {movimentacoes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center gm-text-muted">
                      Nenhuma movimentação cadastrada
                    </td>
                  </tr>
                ) : (
                  movimentacoes.map((mov) => (
                    <tr key={mov.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(mov.data)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          mov.tipo === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{mov.descricao}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm gm-text-muted">{mov.categoria}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        mov.tipo === 'entrada' ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {mov.tipo === 'entrada' ? '+' : '-'} {formatCurrency(mov.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm gm-text-muted">
                        {mov.projetoId ? projetos.find(p => p.id === mov.projetoId)?.nome || '-' : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(mov)}
                            className="text-blue-300 hover:text-blue-200"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(mov.id)}
                            className="text-red-300 hover:text-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

