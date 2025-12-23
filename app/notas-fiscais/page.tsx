'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { storageService } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/utils';
import { NotaFiscal } from '@/types';

export default function NotasFiscaisPage() {
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    numero: '',
    serie: '',
    tipo: 'saida' as 'entrada' | 'saida',
    dataEmissao: new Date().toISOString().split('T')[0],
    valor: '',
    clienteFornecedor: '',
    projetoId: '',
    observacoes: '',
  });

  useEffect(() => {
    loadNotas();
  }, []);

  const loadNotas = () => {
    const data = storageService.getNotasFiscais();
    setNotas(data.sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime()));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nota: NotaFiscal = {
      id: editingId || crypto.randomUUID(),
      numero: formData.numero,
      serie: formData.serie || undefined,
      tipo: formData.tipo,
      dataEmissao: formData.dataEmissao,
      valor: parseFloat(formData.valor),
      clienteFornecedor: formData.clienteFornecedor,
      projetoId: formData.projetoId || undefined,
      observacoes: formData.observacoes || undefined,
      createdAt: editingId ? notas.find(n => n.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
    };

    if (editingId) {
      storageService.updateNotaFiscal(editingId, nota);
    } else {
      storageService.saveNotaFiscal(nota);
    }

    resetForm();
    loadNotas();
  };

  const handleEdit = (nota: NotaFiscal) => {
    setEditingId(nota.id);
    setFormData({
      numero: nota.numero,
      serie: nota.serie || '',
      tipo: nota.tipo,
      dataEmissao: nota.dataEmissao.split('T')[0],
      valor: nota.valor.toString(),
      clienteFornecedor: nota.clienteFornecedor,
      projetoId: nota.projetoId || '',
      observacoes: nota.observacoes || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta nota fiscal?')) {
      storageService.deleteNotaFiscal(id);
      loadNotas();
    }
  };

  const resetForm = () => {
    setFormData({
      numero: '',
      serie: '',
      tipo: 'saida',
      dataEmissao: new Date().toISOString().split('T')[0],
      valor: '',
      clienteFornecedor: '',
      projetoId: '',
      observacoes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const projetos = storageService.getProjetos();

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
                <h1 className="text-3xl font-bold text-gray-900">Notas Fiscais</h1>
                <p className="mt-1 text-gray-600">Emitir e gerenciar notas fiscais</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>{showForm ? 'Cancelar' : 'Nova Nota Fiscal'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'entrada' | 'saida' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="saida">Saída</option>
                    <option value="entrada">Entrada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Emissão</label>
                  <input
                    type="date"
                    value={formData.dataEmissao}
                    onChange={(e) => setFormData({ ...formData, dataEmissao: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Série (opcional)</label>
                  <input
                    type="text"
                    value={formData.serie}
                    onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.tipo === 'saida' ? 'Cliente' : 'Fornecedor'}
                  </label>
                  <input
                    type="text"
                    value={formData.clienteFornecedor}
                    onChange={(e) => setFormData({ ...formData, clienteFornecedor: e.target.value })}
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
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente/Fornecedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Nenhuma nota fiscal cadastrada
                    </td>
                  </tr>
                ) : (
                  notas.map((nota) => (
                    <tr key={nota.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(nota.dataEmissao)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {nota.numero}{nota.serie ? ` - Série ${nota.serie}` : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          nota.tipo === 'entrada' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {nota.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{nota.clienteFornecedor}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(nota.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(nota)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(nota.id)}
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

