'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import type { Cliente, TipoPessoa } from '@/types';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { TABLES } from '@/lib/db/tables';

type DbCliente = {
  id: string;
  tenant_id: string;
  tipo_pessoa: 'pf' | 'pj';
  nome: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  cpf_cnpj: string | null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  email: string | null;
  telefone: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  pais: string | null;
  observacoes: string | null;
  created_at: string;
};

function mapClienteFromDb(r: DbCliente): Cliente {
  return {
    id: r.id,
    nome: r.nome,
    tipoPessoa: r.tipo_pessoa,
    razaoSocial: r.razao_social ?? undefined,
    nomeFantasia: r.nome_fantasia ?? undefined,
    cpfCnpj: r.cpf_cnpj ?? undefined,
    inscricaoEstadual: r.inscricao_estadual ?? undefined,
    inscricaoMunicipal: r.inscricao_municipal ?? undefined,
    email: r.email ?? undefined,
    telefone: r.telefone ?? undefined,
    cep: r.cep ?? undefined,
    logradouro: r.logradouro ?? undefined,
    numero: r.numero ?? undefined,
    complemento: r.complemento ?? undefined,
    bairro: r.bairro ?? undefined,
    cidade: r.cidade ?? undefined,
    uf: r.uf ?? undefined,
    pais: r.pais ?? undefined,
    observacoes: r.observacoes ?? undefined,
    createdAt: r.created_at,
  };
}

async function getTenantId() {
  const supabase = getSupabaseBrowser();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from(TABLES.tenantMembros)
    .select('tenant_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (error) throw error;
  return (data as any).tenant_id as string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    tipoPessoa: 'pj' as TipoPessoa,
    nome: '',
    razaoSocial: '',
    nomeFantasia: '',
    cpfCnpj: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    email: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    pais: 'Brasil',
    observacoes: '',
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) =>
      [c.nome, c.cpfCnpj, c.email, c.telefone, c.razaoSocial, c.nomeFantasia]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [clientes, query]);

  const load = async () => {
    setErro(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      // RLS filtra por tenant automaticamente (quando políticas estiverem ativas).
      const { data, error } = await supabase.from(TABLES.clientes).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setClientes(((data ?? []) as DbCliente[]).map(mapClienteFromDb));
    } catch (e: any) {
      setErro(e?.message ?? 'Falha ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setFormData({
      tipoPessoa: 'pj',
      nome: '',
      razaoSocial: '',
      nomeFantasia: '',
      cpfCnpj: '',
      inscricaoEstadual: '',
      inscricaoMunicipal: '',
      email: '',
      telefone: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      pais: 'Brasil',
      observacoes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (c: Cliente) => {
    setEditingId(c.id);
    setFormData({
      tipoPessoa: c.tipoPessoa,
      nome: c.nome,
      razaoSocial: c.razaoSocial ?? '',
      nomeFantasia: c.nomeFantasia ?? '',
      cpfCnpj: c.cpfCnpj ?? '',
      inscricaoEstadual: c.inscricaoEstadual ?? '',
      inscricaoMunicipal: c.inscricaoMunicipal ?? '',
      email: c.email ?? '',
      telefone: c.telefone ?? '',
      cep: c.cep ?? '',
      logradouro: c.logradouro ?? '',
      numero: c.numero ?? '',
      complemento: c.complemento ?? '',
      bairro: c.bairro ?? '',
      cidade: c.cidade ?? '',
      uf: c.uf ?? '',
      pais: c.pais ?? 'Brasil',
      observacoes: c.observacoes ?? '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    setErro(null);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.from(TABLES.clientes).delete().eq('id', id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      setErro(e?.message ?? 'Falha ao excluir cliente');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      const tenantId = await getTenantId();
      if (!tenantId) throw new Error('Sem tenant. Faça login e complete o cadastro do ambiente.');

      const payload: Partial<DbCliente> = {
        tenant_id: tenantId,
        tipo_pessoa: formData.tipoPessoa,
        nome: formData.nome,
        razao_social: formData.razaoSocial || null,
        nome_fantasia: formData.nomeFantasia || null,
        cpf_cnpj: formData.cpfCnpj || null,
        inscricao_estadual: formData.inscricaoEstadual || null,
        inscricao_municipal: formData.inscricaoMunicipal || null,
        email: formData.email || null,
        telefone: formData.telefone || null,
        cep: formData.cep || null,
        logradouro: formData.logradouro || null,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        cidade: formData.cidade || null,
        uf: formData.uf || null,
        pais: formData.pais || 'Brasil',
        observacoes: formData.observacoes || null,
      };

      if (editingId) {
        const { error } = await supabase.from(TABLES.clientes).update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(TABLES.clientes).insert(payload);
        if (error) throw error;
      }

      resetForm();
      await load();
    } catch (e: any) {
      setErro(e?.message ?? 'Falha ao salvar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="gm-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="gm-text-muted hover:text-white">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Clientes</h1>
                <p className="mt-1 gm-text-muted">Cadastro de clientes e empresas</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-fuchsia-600 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-700 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>{showForm ? 'Cancelar' : 'Novo Cliente'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="gm-surface rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium gm-text-muted mb-1">Buscar</label>
            <input className="gm-input w-full rounded-lg px-3 py-2" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome, CPF/CNPJ, e-mail..." />
          </div>
          <div className="gm-text-muted text-sm">{loading ? 'Carregando...' : `${filtered.length} cliente(s)`}</div>
        </div>

        {erro && <div className="gm-surface rounded-lg p-4 text-red-300">{erro}</div>}

        {showForm && (
          <div className="gm-surface rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Tipo</label>
                  <select className="gm-select w-full rounded-lg px-3 py-2" value={formData.tipoPessoa} onChange={(e) => setFormData({ ...formData, tipoPessoa: e.target.value as TipoPessoa })}>
                    <option value="pj">Pessoa Jurídica</option>
                    <option value="pf">Pessoa Física</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium gm-text-muted mb-1">Nome</label>
                  <input className="gm-input w-full rounded-lg px-3 py-2" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium gm-text-muted mb-1">Razão Social</label>
                  <input className="gm-input w-full rounded-lg px-3 py-2" value={formData.razaoSocial} onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Nome Fantasia</label>
                  <input className="gm-input w-full rounded-lg px-3 py-2" value={formData.nomeFantasia} onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">CPF/CNPJ</label>
                  <input className="gm-input w-full rounded-lg px-3 py-2" value={formData.cpfCnpj} onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Inscrição Estadual</label>
                  <input className="gm-input w-full rounded-lg px-3 py-2" value={formData.inscricaoEstadual} onChange={(e) => setFormData({ ...formData, inscricaoEstadual: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Inscrição Municipal</label>
                  <input className="gm-input w-full rounded-lg px-3 py-2" value={formData.inscricaoMunicipal} onChange={(e) => setFormData({ ...formData, inscricaoMunicipal: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">E-mail</label>
                  <input className="gm-input w-full rounded-lg px-3 py-2" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} type="email" />
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Telefone</label>
                  <input className="gm-input w-full rounded-lg px-3 py-2" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">CEP</label>
                  <input className="gm-input w-full rounded-lg px-3 py-2" value={formData.cep} onChange={(e) => setFormData({ ...formData, cep: e.target.value })} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium gm-text-muted mb-1">Logradouro</label>
                  <input className="gm-input w-full rounded-lg px-3 py-2" value={formData.logradouro} onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Número</label>
                  <input className="gm-input w-full rounded-lg px-3 py-2" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium gm-text-muted mb-1">Complemento</label>
                  <input className="gm-input w-full rounded-lg px-3 py-2" value={formData.complemento} onChange={(e) => setFormData({ ...formData, complemento: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Bairro</label>
                  <input className="gm-input w-full rounded-lg px-3 py-2" value={formData.bairro} onChange={(e) => setFormData({ ...formData, bairro: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">Cidade</label>
                  <input className="gm-input w-full rounded-lg px-3 py-2" value={formData.cidade} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">UF</label>
                  <input className="gm-input w-full rounded-lg px-3 py-2" value={formData.uf} onChange={(e) => setFormData({ ...formData, uf: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium gm-text-muted mb-1">País</label>
                  <input className="gm-input w-full rounded-lg px-3 py-2" value={formData.pais} onChange={(e) => setFormData({ ...formData, pais: e.target.value })} />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium gm-text-muted mb-1">Observações</label>
                  <textarea className="gm-textarea w-full rounded-lg px-3 py-2" rows={3} value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-3">
                <button disabled={loading} className="bg-fuchsia-600 text-white px-6 py-2 rounded-lg hover:bg-fuchsia-700">
                  {editingId ? 'Atualizar' : 'Salvar'}
                </button>
                <button type="button" onClick={resetForm} className="bg-white/10 text-white px-6 py-2 rounded-lg hover:bg-white/15 border border-white/10">
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
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">CPF/CNPJ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">E-mail</th>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Telefone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium gm-text-muted uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center gm-text-muted">
                      Nenhum cliente cadastrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id}>
                      <td className="px-6 py-4 text-sm">{c.nome}</td>
                      <td className="px-6 py-4 text-sm gm-text-muted">{c.tipoPessoa === 'pj' ? 'PJ' : 'PF'}</td>
                      <td className="px-6 py-4 text-sm gm-text-muted">{c.cpfCnpj ?? '-'}</td>
                      <td className="px-6 py-4 text-sm gm-text-muted">{c.email ?? '-'}</td>
                      <td className="px-6 py-4 text-sm gm-text-muted">{c.telefone ?? '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-3">
                          <button onClick={() => handleEdit(c)} className="text-blue-300 hover:text-blue-200">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="text-red-300 hover:text-red-200">
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


