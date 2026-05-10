# MES Amafil — Frontend

Interface web do Sistema de Execução de Manufatura (MES) para a Amafil. Construída com React + Vite, servida via Express.

## Responsabilidade

Camada de apresentação do MES: acompanhamento de ordens de produção, execução de operações, registro de paradas, solicitações de suporte e relatórios de chão de fábrica.

## Ferramentas e versões

| Ferramenta       | Versão  |
|------------------|---------|
| Node.js          | 25.x    |
| React            | 19.x    |
| TypeScript       | 5.8.x   |
| Vite             | 6.x     |
| TailwindCSS      | 4.x     |
| React Router DOM | 7.x     |
| Recharts         | 3.x     |
| @google/genai    | 1.29.x  |

## Estrutura

```
src/
├── components/
│   ├── layout/        # Header, Sidebar, KPICard
│   └── dashboard/     # Componentes do painel principal
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
│   └── utils.ts
├── types.ts
└── App.tsx
```

## Rotas

| Rota             | Página                 |
|------------------|------------------------|
| `/`              | Dashboard              |
| `/producao`      | Produção               |
| `/ops`           | Lista de Ordens        |
| `/paradas`       | Paradas / Downtime     |
| `/operacao`      | Execução de Produção   |
| `/solicitacoes`  | Solicitações de Suporte|
| `/relatorios`    | Relatórios             |
| `/usuarios`      | Usuários               |
| `/mensagens`     | Mensagens              |
| `/config`        | Configurações          |

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
GEMINI_API_KEY=   # Chave da API Gemini (Google AI)
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

- **Express** — servidor HTTP que injeta a `GEMINI_API_KEY` no backend
- **@google/genai** — integração com Gemini AI
- **Recharts** — gráficos nos painéis e relatórios
- **Motion** — animações de transição entre páginas
- **Lucide React** — ícones
- **date-fns** — formatação de datas
