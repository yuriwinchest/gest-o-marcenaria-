# Relatório de Segurança — Gestão de Marcenaria

## Resumo executivo

Foram identificados pontos de risco relacionados principalmente a **rotas server-side com Service Role** expostas e a necessidade de **RLS + privilégios** no Supabase para garantir isolamento multi-tenant.

## Achados

### 1) Credenciais expostas em conversa / histórico
- **Risco**: chaves e senha do Postgres/Supabase foram compartilhadas fora do ambiente seguro.
- **Impacto**: acesso total ao banco se essas credenciais forem reutilizadas.
- **Ação recomendada**: **rotacionar** `POSTGRES_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY` e revisar logs.

### 2) Rotas API CRUD com Service Role (alta severidade)
- **Risco**: endpoints de CRUD usando Service Role podem ignorar RLS e permitir operações fora do tenant.
- **Ação**: removidas do código (mantida apenas a rota de registro necessária).

### 3) Isolamento multi-tenant deve ser aplicado via RLS + GRANT/REVOKE
- **Risco**: sem RLS/policies e sem GRANT/REVOKE, um usuário pode ver/escrever dados indevidos.
- **Ação**: `db/schema-multitenant.sql` inclui RLS e (agora) `REVOKE` de `public` + `GRANT` apenas para `authenticated`.

### 4) Registro de usuário sem e-mail
- **Risco**: falhas de SMTP podem impedir signup.
- **Ação**: registro server-side via `auth.admin.createUser({ email_confirm: true })` sem depender de e-mail.

## Correções aplicadas no código

- Remoção das rotas:
  - `app/api/movimentacoes/*`
  - `app/api/projetos/*`
  - `app/api/contas-pagar/*`
  - `app/api/contas-receber/*`
  - `app/api/notas-fiscais/*`
- Mantida a rota:
  - `app/api/auth/registro/route.ts` (cria usuário/tenant/membro)
- Reforço do SQL multi-tenant:
  - `db/schema-multitenant.sql` com GRANT/REVOKE e RLS.

## Checklist recomendado (operacional)

1. Rotacionar credenciais no Supabase (Service Role / Secret / DB password).
2. Rodar `db/schema-multitenant.sql` (ou a parte nova) no SQL Editor.
3. Confirmar que RLS está habilitado e policies ativas.
4. Revisar permissões (GRANT/REVOKE) e testar com usuário `authenticated`.
5. Monitorar tentativas de signup (rate limit/captcha se necessário).


