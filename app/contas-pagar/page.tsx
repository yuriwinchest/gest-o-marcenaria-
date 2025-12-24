'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2, Check } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ContaPagar, Projeto, StatusConta } from '@/types';

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
    const [contasRes, projetosRes] = await Promise.all([
      fetch('/api/contas-pagar', { cache: 'no-store' }),
      fetch('/api/projetos', { cache: 'no-store' }),
    ]);
    const contasJson = await contasRes.json();
    const projetosJson = await projetosRes.json();
    if (contasJson.ok) setContas(contasJson.data);
    if (projetosJson.ok) setProjetos(projetosJson.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    if (editingId) {
      await fetch(`/api/contas-pagar/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conta),
      });
    } else {
      await fetch('/api/contas-pagar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conta),
      });
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
      await fetch(`/api/contas-pagar/${id}`, { method: 'DELETE' });
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
      await fetch(`/api/contas-pagar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Contas a Pagar</h1>
                <p className="mt-1 text-gray-600">Gerenciar contas a pagar</p>
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
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <input
                    type="text"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                  <input
                    type="text"
                    value={formData.fornecedor}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Projeto (opcional)</label>
                  <select
                    value={formData.projetoId}
                    onChange={(e) => setFormData({ ...formData, projetoId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Nenhum</option>
                    {projetos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Nenhuma conta a pagar cadastrada
                    </td>
                  </tr>
                ) : (
                  contas.map((conta) => (
                    <tr key={conta.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(conta.dataVencimento)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{conta.descricao}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conta.fornecedor}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
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
                              className="text-green-600 hover:text-green-900"
                              title="Marcar como paga"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(conta)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(conta.id)}
                            className="text-red-600 hover:text-red-900"
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

