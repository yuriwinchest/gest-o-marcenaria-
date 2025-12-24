'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase/browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
      router.replace('/');
    } catch (err: any) {
      setErro(err?.message ?? 'Falha ao entrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="gm-surface rounded-xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-1">Entrar</h1>
        <p className="gm-text-muted mb-6">Acesse seu ambiente</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium gm-text-muted mb-1">E-mail</label>
            <input className="gm-input w-full rounded-lg px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label className="block text-sm font-medium gm-text-muted mb-1">Senha</label>
            <input className="gm-input w-full rounded-lg px-3 py-2" value={senha} onChange={(e) => setSenha(e.target.value)} type="password" required />
          </div>

          {erro && <div className="text-red-300 text-sm">{erro}</div>}

          <button disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-2 font-medium">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-sm gm-text-muted">
          Não tem conta? <Link className="text-violet-200 hover:text-violet-100 underline" href="/registro">Criar agora</Link>
        </div>
      </div>
    </div>
  );
}


