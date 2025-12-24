'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Projeto } from '@/types';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { TABLES } from '@/lib/db/tables';
import { getTenantIdOrThrow } from '@/lib/tenant/getTenantId';
import { mapProjetoFromDb, mapProjetoToDb, type DbProjeto } from '@/lib/db/mappers';

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: '',
    status: 'ativo' as 'ativo' | 'concluido' | 'cancelado',
  });

  useEffect(() => {
    loadProjetos();
  }, []);

  const loadProjetos = async () => {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.from(TABLES.projetos).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    setProjetos(((data ?? []) as DbProjeto[]).map(mapProjetoFromDb));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tenantId = await getTenantIdOrThrow();
    const supabase = getSupabaseBrowser();
    const projeto: Projeto = {
      id: editingId || crypto.randomUUID(),
      nome: formData.nome,
      descricao: formData.descricao || undefined,
      dataInicio: formData.dataInicio,
      dataFim: formData.dataFim || undefined,
      status: formData.status,
      createdAt: new Date().toISOString(),
    };

    const payload = { ...mapProjetoToDb(projeto), tenant_id: tenantId };
    if (editingId) {
      const { error } = await supabase.from(TABLES.projetos).update(payload).eq('id', editingId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from(TABLES.projetos).insert(payload);
      if (error) throw error;
    }

    resetForm();
    await loadProjetos();
  };

  const handleEdit = (projeto: Projeto) => {
    setEditingId(projeto.id);
    setFormData({
      nome: projeto.nome,
      descricao: projeto.descricao || '',
      dataInicio: projeto.dataInicio.split('T')[0],
      dataFim: projeto.dataFim ? projeto.dataFim.split('T')[0] : '',
      status: projeto.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.from(TABLES.projetos).delete().eq('id', id);
      if (error) throw error;
      await loadProjetos();
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      dataInicio: new Date().toISOString().split('T')[0],
      dataFim: '',
      status: 'ativo',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-blue-100 text-blue-800';
      case 'concluido':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
                <h1 className="text-3xl font-bold">Projetos / Obras</h1>
                <p className="mt-1 gm-text-muted">Gerenciar projetos e obras</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>{showForm ? 'Cancelar' : 'Novo Projeto'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showForm && (
          <div className="gm-surface rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Editar Projeto' : 'Novo Projeto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Nome do Projeto</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 gm-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-lg px-3 py-2 gm-select"
                    required
                  >
                    <option value="ativo">Ativo</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Data de Início</label>
                  <input
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 gm-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Data de Fim (opcional)</label>
                  <input
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 gm-input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium gm-text-muted mb-1">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 gm-textarea"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projetos.length === 0 ? (
            <div className="col-span-full text-center gm-text-muted py-8">
              Nenhum projeto cadastrado
            </div>
          ) : (
            projetos.map((projeto) => (
              <div key={projeto.id} className="gm-surface rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold">{projeto.nome}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(projeto.status)}`}>
                    {projeto.status === 'ativo' ? 'Ativo' : projeto.status === 'concluido' ? 'Concluído' : 'Cancelado'}
                  </span>
                </div>
                {projeto.descricao && (
                  <p className="gm-text-muted text-sm mb-4">{projeto.descricao}</p>
                )}
                <div className="space-y-2 mb-4">
                  <div className="text-sm gm-text-muted">
                    <span className="font-medium">Início:</span> {formatDate(projeto.dataInicio)}
                  </div>
                  {projeto.dataFim && (
                    <div className="text-sm gm-text-muted">
                      <span className="font-medium">Fim:</span> {formatDate(projeto.dataFim)}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(projeto)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(projeto.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

