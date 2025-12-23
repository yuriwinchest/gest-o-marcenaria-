# Gestão de Marcenaria

Sistema completo de gestão financeira para marcenaria, desenvolvido com Next.js, TypeScript e Tailwind CSS.

## Funcionalidades

- ✅ **Lançamento de Movimentações Financeiras**: Registro de entradas e saídas
- ✅ **Contas a Pagar**: Gerenciamento completo de contas a pagar
- ✅ **Contas a Receber**: Controle de contas a receber
- ✅ **Projetos/Obras**: Organização de projetos e obras
- ✅ **Notas Fiscais**: Emissão e gerenciamento de notas fiscais
- ✅ **Relatórios Financeiros**:
  - Fluxo de Caixa
  - DRE (Demonstração do Resultado do Exercício)
  - Resumo Mensal
  - Lucro e Despesas por Projeto

## Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **date-fns** - Manipulação de datas
- **lucide-react** - Ícones

## Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar em produção
npm start
```

## Estrutura do Projeto

```
├── app/                    # Páginas e rotas (App Router)
│   ├── movimentacoes/      # Lançamento de movimentações
│   ├── contas-pagar/       # Contas a pagar
│   ├── contas-receber/     # Contas a receber
│   ├── projetos/           # Projetos/obras
│   ├── notas-fiscais/      # Notas fiscais
│   └── relatorios/         # Relatórios financeiros
├── lib/                    # Utilitários e serviços
│   ├── storage.ts          # Gerenciamento de dados (localStorage)
│   └── utils.ts            # Funções auxiliares
├── types/                  # Definições TypeScript
└── public/                 # Arquivos estáticos
```

## Armazenamento de Dados

Os dados são armazenados localmente no navegador usando `localStorage`. Para produção, recomenda-se migrar para um banco de dados.

## Deploy

### Vercel

1. Conecte seu repositório GitHub à Vercel
2. A Vercel detectará automaticamente o Next.js
3. O deploy será feito automaticamente a cada push

### Variáveis de Ambiente

Não são necessárias variáveis de ambiente para o funcionamento básico.

## Licença

Este projeto é de uso interno.

