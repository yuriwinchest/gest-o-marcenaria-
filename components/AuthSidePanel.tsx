import Image from 'next/image';

export function AuthSidePanel() {
  return (
    <aside className="hidden lg:block">
      <div className="gm-surface rounded-2xl p-8 h-full">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-bold">Gestão de Marcenaria</h2>
            <p className="gm-text-muted mt-2">
              Controle financeiro completo para sua marcenaria, com organização por projeto/obra e relatórios automáticos.
            </p>
          </div>

          <ul className="space-y-3 text-sm">
            <li className="gm-text-muted">
              <span className="text-white font-semibold">Movimentações:</span> entradas e saídas com categoria e vínculo a projeto.
            </li>
            <li className="gm-text-muted">
              <span className="text-white font-semibold">Contas:</span> a pagar e a receber com status e vencimentos.
            </li>
            <li className="gm-text-muted">
              <span className="text-white font-semibold">Notas fiscais:</span> registro e apoio operacional.
            </li>
            <li className="gm-text-muted">
              <span className="text-white font-semibold">Relatórios:</span> fluxo de caixa, DRE e lucro por projeto.
            </li>
            <li className="gm-text-muted">
              <span className="text-white font-semibold">Multi-tenant:</span> cada empresa tem seu próprio ambiente e dados isolados.
            </li>
          </ul>

          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20">
            {/* Coloque sua foto real em: public/hero-marcenaria.jpg */}
            <Image
              src="/hero-marcenaria.jpg"
              alt="Marcenaria - organização e gestão"
              width={1200}
              height={800}
              className="w-full h-64 object-cover"
              priority
              onError={(e) => {
                // Fallback visual simples caso a imagem não exista ainda
                const img = e.currentTarget as unknown as HTMLImageElement;
                img.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-xs gm-text-muted">
              Dica: envie uma foto real da sua marcenaria/produção e renomeie para <span className="text-white">hero-marcenaria.jpg</span>.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}


