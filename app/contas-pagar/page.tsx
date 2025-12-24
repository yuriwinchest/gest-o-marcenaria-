'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2, Check } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ContaPagar, Projeto, StatusConta } from '@/types';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { TABLES } from '@/lib/db/tables';
import { getTenantIdOrThrow } from '@/lib/tenant/getTenantId';
import { mapContaPagarFromDb, mapContaPagarToDb, mapProjetoFromDb, type DbContaPagar, type DbProjeto } from '@/lib/db/mappers';

export default function ContasPagarPage() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    dataVencimento: '',
    fornecedor: '',
    categoria: '',
    projetoId: '',
    observacoes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = getSupabaseBrowser();
    const [{ data: contasData, error: contasError }, { data: projetosData, error: projetosError }] = await Promise.all([
      supabase.from(TABLES.contasPagar).select('*').order('data_vencimento', { ascending: true }),
      supabase.from(TABLES.projetos).select('*').order('created_at', { ascending: false }),
    ]);
    if (contasError) throw contasError;
    if (projetosError) throw projetosError;
    setContas(((contasData ?? []) as DbContaPagar[]).map(mapContaPagarFromDb));
    setProjetos(((projetosData ?? []) as DbProjeto[]).map(mapProjetoFromDb));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tenantId = await getTenantIdOrThrow();
    const supabase = getSupabaseBrowser();
    const existing = editingId ? contas.find(c => c.id === editingId) : undefined;
    const conta: ContaPagar = {
      id: editingId || crypto.randomUUID(),
      descricao: formData.descricao,
      valor: parseFloat(formData.valor),
      dataVencimento: formData.dataVencimento,
      status: existing?.status ?? 'pendente',
      dataPagamento: existing?.dataPagamento,
      fornecedor: formData.fornecedor,
      categoria: formData.categoria,
      projetoId: formData.projetoId || undefined,
      observacoes: formData.observacoes || undefined,
      createdAt: new Date().toISOString(),
    };

    const payload = { ...mapContaPagarToDb(conta), tenant_id: tenantId };
    if (editingId) {
      const { error } = await supabase.from(TABLES.contasPagar).update(payload).eq('id', editingId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from(TABLES.contasPagar).insert(payload);
      if (error) throw error;
    }

    resetForm();
    await loadData();
  };

  const handleEdit = (conta: ContaPagar) => {
    setEditingId(conta.id);
    setFormData({
      descricao: conta.descricao,
      valor: conta.valor.toString(),
      dataVencimento: conta.dataVencimento.split('T')[0],
      fornecedor: conta.fornecedor,
      categoria: conta.categoria,
      projetoId: conta.projetoId || '',
      observacoes: conta.observacoes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.from(TABLES.contasPagar).delete().eq('id', id);
      if (error) throw error;
      await loadData();
    }
  };

  const handleMarcarPaga = async (id: string) => {
    const conta = contas.find(c => c.id === id);
    if (conta) {
      const updated: ContaPagar = {
        ...conta,
        status: 'paga',
        dataPagamento: new Date().toISOString().split('T')[0],
      };
      const tenantId = await getTenantIdOrThrow();
      const supabase = getSupabaseBrowser();
      const payload = { ...mapContaPagarToDb(updated), tenant_id: tenantId };
      const { error } = await supabase.from(TABLES.contasPagar).update(payload).eq('id', id);
      if (error) throw error;
      await loadData();
    }
  };

  const resetForm = () => {
    setFormData({
      descricao: '',
      valor: '',
      dataVencimento: '',
      fornecedor: '',
      categoria: '',
      projetoId: '',
      observacoes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getStatusColor = (status: StatusConta, dataVencimento: string) => {
    if (status === 'paga') return 'bg-green-100 text-green-800';
    if (status === 'vencida') return 'bg-red-100 text-red-800';
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    if (vencimento < hoje) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
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
                <h1 className="text-3xl font-bold">Contas a Pagar</h1>
                <p className="mt-1 gm-text-muted">Gerenciar contas a pagar</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>{showForm ? 'Cancelar' : 'Nova Conta'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showForm && (
          <div className="gm-surface rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium gm-text-muted mb-1">Fornecedor</label>
                  <input
                    type="text"
                    value={formData.fornecedor}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
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
                  <label className="block text-sm font-medium gm-text-muted mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
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
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
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
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Vencimento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Fornecedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {contas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center gm-text-muted">
                      Nenhuma conta a pagar cadastrada
                    </td>
                  </tr>
                ) : (
                  contas.map((conta) => (
                    <tr key={conta.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(conta.dataVencimento)}</td>
                      <td className="px-6 py-4 text-sm">{conta.descricao}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm gm-text-muted">{conta.fornecedor}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-300">
                        {formatCurrency(conta.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(conta.status, conta.dataVencimento)}`}>
                          {conta.status === 'paga' ? 'Paga' : conta.status === 'vencida' ? 'Vencida' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {conta.status !== 'paga' && (
                            <button
                              onClick={() => handleMarcarPaga(conta.id)}
                              className="text-green-300 hover:text-green-200"
                              title="Marcar como paga"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(conta)}
                            className="text-blue-300 hover:text-blue-200"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(conta.id)}
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

