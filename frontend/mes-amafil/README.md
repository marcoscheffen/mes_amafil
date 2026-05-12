# MES Amafil — Frontend (Protótipo)

Protótipo do frontend do Sistema de Execução de Manufatura para a Amafil. Todas as telas estão implementadas com dados mockados. Stack de produção será Next.js 15 Static Export (ver [PRD Infra](../../PRD/PRD_infra.md)).

## Ferramentas e versões

| Ferramenta | Versão |
|---|---|
| Node.js | 25.x |
| React | 19.x |
| TypeScript | 5.8.x |
| Vite | 6.x |
| TailwindCSS | 4.x |
| React Router DOM | 7.x |
| Recharts | 3.x |
| @google/genai | 1.29.x |

## Estrutura

```
src/
├── components/
│   ├── layout/        # Header, Sidebar
│   └── dashboard/     # KPICard e demais componentes do painel
├── pages/             # Uma página por rota
│   ├── Dashboard.tsx
│   ├── Production.tsx
│   ├── ProductionExecution.tsx
│   ├── OrderList.tsx
│   ├── DowntimeList.tsx
│   ├── SupportRequests.tsx
│   ├── Reports.tsx
│   ├── Users.tsx
│   ├── Messages.tsx
│   └── Settings.tsx
├── lib/
│   ├── utils.ts
│   └── message-channels.ts   # canais do módulo Mensagens (localStorage + defaults)
├── types.ts
└── App.tsx
```

## Rotas

| Rota | Página |
|---|---|
| `/` | Dashboard |
| `/producao` | Produção / Status de Máquinas |
| `/ops` | Lista de Ordens |
| `/paradas` | Paradas / Downtime |
| `/operacao` | Execução de Produção |
| `/solicitacoes` | Solicitações de Suporte |
| `/relatorios` | Relatórios |
| `/usuarios` | Usuários |
| `/mensagens` | Mensagens |
| `/config` | Configurações |

## Deploy na Vercel (SPA)

O app é uma SPA (React Router). Para o menu e URLs diretas funcionarem em produção:

1. **`NavLink` no menu lateral** — Os itens em `src/components/layout/Sidebar.tsx` usam `NavLink` do React Router (não `<a href>`), evitando recarga completa ao trocar de rota.
2. **`vercel.json`** — Rewrite de todas as rotas para `index.html`, para que refresh ou link direto (ex.: `/operacao`) não retornem 404. Arquivos estáticos do build (`/assets/*`, etc.) continuam sendo servidos pela Vercel antes do rewrite.

Após alterações relevantes ao roteamento ou ao deploy, mantenha esta seção alinhada ao que está no repositório.

## Funcionalidades implementadas

- **Dashboard** — KPIs de turno em tempo real com gráficos (Recharts)
- **Produção** — monitoramento de 35 máquinas nos setores Diversos, Farinha, Polvilho e Massa Tapioca; códigos no padrão operacional (`EMP-01A`, `COL-03A`, `ENS-22A-KSP`)
- **Execução de OP** — início, paradas e finalização de turno; botão **Solicitar Reforço** abre menu de Ações Rápidas (MNT, ALM, PCP) com formulário modal
- **Ordens / Paradas / Solicitações** — listas filtráveis com dados mockados
- **Relatórios** — gráficos agregados por turno e período
- **Mensagens** — canais internos (Geral fixo + canais persistidos: Manutenção, PCP, Avisos, TI, etc.); edição em **Configurações → Mensagens**
- **Usuários / Configurações** — gestão básica de perfis; aba **Mensagens** para criar, editar e excluir canais de comunicação (protótipo: `localStorage`)
- **SPA na Vercel** — `NavLink` no menu lateral + `vercel.json` com rewrite para `index.html`

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
GEMINI_API_KEY=   # Chave da API Gemini (Google AI) — usado para OCR de rótulos
APP_URL=          # URL base da aplicação
```

## Como executar

```bash
# Instalar dependências
npm install

# Desenvolvimento (servidor Express + Vite HMR)
npm run dev

# Build de produção
npm run build

# Verificar tipos TypeScript
npm run lint
```

## Dependências principais

- **Express** — servidor HTTP que injeta a `GEMINI_API_KEY` via backend antes de servir o app
- **@google/genai** — integração com Gemini AI para OCR de lote/validade
- **Recharts** — gráficos nos painéis e relatórios
- **Motion** — animações de transição entre páginas
- **Lucide React** — ícones
- **date-fns** — formatação de datas

## Próximos passos

Migração para Next.js 15 Static Export com:
- Supabase Auth (GoTrue) em substituição aos dados mockados
- Service Worker para operação offline (PWA)
- shadcn/ui sobre Tailwind CSS
- Zustand para estado global
- React Hook Form + Zod para formulários
