# Configuração Supabase (Gestão de Marcenaria)

## Variáveis de ambiente necessárias

Configure **no seu ambiente local** (ex: `.env.local`) e também na **Vercel** (Project → Settings → Environment Variables):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (**apenas servidor**; não usar com `NEXT_PUBLIC_`)

Opcional (somente se você quiser usar Supabase direto no browser no futuro):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Criar tabelas no Supabase

No Supabase:

- Database → SQL Editor → New query
- Cole o conteúdo de `db/schema.sql`
- Run

As tabelas terão prefixo `gestao_marcenaria__*` para fácil identificação no mesmo banco.


