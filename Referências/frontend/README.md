# Ayvi — AI Agent Manager

> Frontend da plataforma Ayvi: multi-tenant para gerenciamento de agentes conversacionais de IA, bases de conhecimento, tarefas Kanban, agenda e interações com clientes. Interface dark-mode construída com React 19 e Supabase.

---

## Stack Tecnológica

| Camada          | Tecnologia                                                   |
| --------------- | ------------------------------------------------------------ |
| **Framework**   | React 19 · TypeScript 5.8                                    |
| **Build**       | Vite 6                                                       |
| **Estilização** | TailwindCSS 3.4 · Manrope (Google Fonts) · Material Symbols  |
| **Backend**     | Supabase (Auth + PostgreSQL + RPC)                           |
| **Gráficos**    | Recharts 3                                                   |
| **Drag & Drop** | @dnd-kit (core + sortable + utilities)                       |
| **IA**          | Google GenAI SDK (`@google/genai`) + Gemini Files API via Edge Function |
| **Testes**      | Vitest 3 · Testing Library · jsdom · Coverage v8             |
| **Deploy**      | Vercel (SPA com rewrite para `index.html`)                   |

---

## Pré-requisitos

- Node.js ≥ 18
- npm

---

## Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente (ver seção abaixo)
# Criar .env.development na raiz do frontend/

# 3. Iniciar servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em **http://localhost:3000**

---

## Scripts Disponíveis

| Comando             | Descrição                           |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento (Vite)  |
| `npm run build`     | Build de produção                   |
| `npm run preview`   | Preview do build de produção        |
| `npm test`          | Testes em modo watch (Vitest)       |
| `npm run test:run`  | Execução única dos testes           |
| `npm run test:ci`   | Testes com relatório de cobertura   |

---

## Variáveis de Ambiente

| Variável                 | Descrição                    |
| ------------------------ | ---------------------------- |
| `VITE_SUPABASE_URL`      | URL do projeto Supabase      |
| `VITE_SUPABASE_ANON_KEY` | Anon Key do projeto Supabase |
| `GEMINI_API_KEY`         | Chave da API Google Gemini (injetada via vite.config.ts) |

**`.env.development`** — carregado com `npm run dev`:
```env
VITE_SUPABASE_URL=https://jiwepyzvfzekftywwkxt.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key_dev>
```

**`.env.production`** — carregado com `npm run build`:
```env
VITE_SUPABASE_URL=https://tfkvgkkqpmafvczodnco.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key_prod>
```

> Os arquivos `.env.*` não são commitados — criar localmente.

---

## Estrutura do Projeto

```
frontend/
├── index.html                    # Entry point HTML (lang pt-BR, dark mode por padrão)
├── index.tsx                     # Bootstrap React 19 com StrictMode
├── App.tsx                       # Router principal + layout (Sidebar + Header)
├── types.ts                      # Interfaces TypeScript globais
├── index.css                     # Estilos globais (TailwindCSS)
│
├── components/
│   ├── Layout/
│   │   ├── Sidebar.tsx           # Menu lateral com navegação e seletor de empresa
│   │   └── Header.tsx            # Barra superior com título, avatar e contexto de empresa
│   ├── Tasks/
│   │   ├── KanbanBoard.tsx       # Quadro Kanban com @dnd-kit (drag-and-drop)
│   │   ├── KanbanColumn.tsx      # Coluna de status do Kanban
│   │   ├── KanbanCard.tsx        # Card de tarefa arrastável
│   │   ├── TaskFormDialog.tsx    # Modal para criar/editar tarefas
│   │   └── TaskListView.tsx      # Visualização em lista das tarefas
│   ├── Agenda/
│   │   ├── AppointmentFormDialog.tsx   # Modal de criação/edição de agendamento
│   │   ├── FollowupSettingsTab.tsx     # Configuração de confirmação automática
│   │   ├── TemplatePreviewModal.tsx    # Preview de templates de mensagens
│   │   └── WeekTimeGrid.tsx            # Grade semanal de horários
│   ├── Settings/
│   │   └── WhatsappCredentialsTab.tsx  # Credenciais WhatsApp/UAZ API
│   ├── EntityShortId.tsx        # Rótulo compacto de ID (CL·/AG·/AT·/TR· + 8 hex); tooltip = UUID completo
│   ├── ContactAvatar.tsx         # Avatar reutilizável de contato
│   ├── Attendance/
│   │   └── AttendanceFormDialog.tsx  # Criação/edição/visualização; vínculo opcional com transcrição (Assistente IA)
│   ├── Customers/
│   │   └── ClientInfoFormsTab.tsx     # Aba Formulários no detalhe do cliente (Cliente Info AI)
│   ├── GlobalAdmin/
│   │   └── GlobalAttendanceTypesTab.tsx # Tipos globais de atendimento
│   └── DevEnvToggle.tsx          # Toggle DEV/PROD (restrito a global_admin)
│
├── pages/
│   ├── LoginPage.tsx             # Autenticação via Supabase (email + senha)
│   ├── CompanySelectionPage.tsx  # Seleção de empresa (multi-tenant)
│   ├── DashboardPage.tsx         # Métricas e visão geral
│   ├── AgentsPage.tsx            # CRUD de agentes de IA
│   ├── ChatPage.tsx              # Conversas em tempo real com clientes
│   ├── MessageLogPage.tsx        # Auditoria de mensagens gravadas em public.messages
│   ├── AssistanteIAPage.tsx      # Upload/transcrição de áudio com Assistente IA
│   ├── KnowledgeBasePage.tsx     # Base de conhecimento (Artigos + FAQs)
│   ├── CustomersPage.tsx         # Gestão de clientes (CRM com dados de IA)
│   ├── TasksPage.tsx             # Tarefas (Kanban + Lista)
│   ├── TaskStatusSettings.tsx    # Configuração de etapas/status do Kanban
│   ├── AgendaPage.tsx            # Agenda e agendamentos
│   ├── AgendaSettingsPage.tsx    # Configurações de agenda e followup automático
│   ├── AttendancePage.tsx        # Registros de atendimento por empresa
│   ├── AttendanceSettingsPage.tsx # Ativar/desativar e ordenar tipos de atendimento
│   ├── UsersPage.tsx             # Gestão de usuários da empresa
│   ├── SettingsPage.tsx          # Configurações visuais (tema, logo, cores, WhatsApp)
│   ├── GlobalAdminPage.tsx       # Painel de administração global (restrito)
│   └── ProfilePage.tsx           # Perfil pessoal do usuário logado
│
├── services/                     # Camada de acesso a dados (Supabase RPC + tabelas)
│   ├── attendancesService.ts     # RPCs de atendimentos e tipos por empresa
│   ├── attendanceTypesAdminService.ts # RPCs globais de tipos (admin da plataforma)
│   ├── agendaService.ts
│   ├── agentsService.ts
│   ├── appointmentsService.ts
│   ├── articlesService.ts
│   ├── chatMessagesService.ts
│   ├── chatwootService.ts
│   ├── clientInfoAIService.ts
│   ├── clientsService.ts
│   ├── clientTypesService.ts
│   ├── companyUsersService.ts
│   ├── faqsService.ts
│   ├── followupService.ts
│   ├── globalAdminService.ts
│   ├── googleCalendarService.ts
│   ├── assistanteIAService.ts
│   ├── messageLogService.ts
│   ├── pontosService.ts
│   ├── promptsService.ts
│   ├── settingsService.ts
│   ├── tagsService.ts
│   ├── taskStatusesService.ts
│   ├── tasksService.ts
│   └── userProfileService.ts
│
├── hooks/
│   ├── useAuth.ts                # Gerenciamento de sessão Supabase
│   └── useGlobalAdmin.ts         # Verificação de permissão global_admin
│
├── contexts/
│   └── CompanyContext.tsx        # Provider de empresa selecionada (multi-tenancy)
│
├── lib/
│   ├── supabase.ts               # Cliente Supabase (DEV/PROD, toggle de ambiente)
│   ├── shortId.ts                # formatação de ID compacto (prefixo + hex do UUID)
│   └── documentFavicon.ts        # Gerenciamento de favicon dinâmico por empresa
│
├── utils/
│   └── profilePhoto.ts           # Normalização de URLs de fotos de perfil
│
├── tests/
│   └── setup.ts                  # Setup Vitest (jsdom)
├── imagens/                      # Logos e ícones (Ayvi)
│
├── vite.config.ts                # Config Vite (porta 3000, alias @, env vars Gemini)
├── tailwind.config.js            # Config TailwindCSS (tema dark, cores customizadas)
├── tsconfig.json                 # Config TypeScript
├── vitest.config.ts              # Config Vitest
├── vercel.json                   # Config deploy Vercel
└── package.json                  # Dependências e scripts
```

### IDs na interface (referência)

Registros do Supabase continuam identificados pelo **UUID** nas APIs. Na UI, listas e modais exibem um **ID compacto** com prefixo por entidade: `CL` (cliente), `AG` (agendamento), `AT` (atendimento), `TR` (transcrição), seguido de `·` e os 8 primeiros caracteres hexadecimais do UUID (sem hífens). O passar do mouse mostra o UUID completo. Implementação: `lib/shortId.ts` e `components/EntityShortId.tsx`.

---

## Rotas da Aplicação

| Rota                | Página                | Descrição                               |
| ------------------- | --------------------- | --------------------------------------- |
| `/`                 | Dashboard             | Página inicial com métricas             |
| `/dashboard`        | Dashboard             | Métricas: agentes, conversas, clientes  |
| `/agents`           | Agentes               | CRUD de agentes de IA                   |
| `/chat`             | Conversas             | Chat em tempo real com clientes         |
| `/message-log`      | Log de Mensagens      | Auditoria de mensagens da tabela `messages` |
| `/assistente-ia`    | Assistente IA         | Upload de áudio e transcrição estruturada |
| `/knowledge`        | Base de Conhecimento  | Artigos e FAQs                          |
| `/customers`        | Clientes              | CRM com dados enriquecidos por IA       |
| `/tasks`            | Tarefas               | Kanban + lista de tarefas               |
| `/tasks/settings`   | Etapas do Kanban      | Config. de status/etapas                |
| `/agenda`           | Agenda                | Agendamentos com grid semanal           |
| `/agenda/settings`  | Config. de Agenda     | Followup automático e templates         |
| `/atendimento`      | Atendimentos          | Registros de atendimento por empresa    |
| `/atendimento/settings` | Ajustes de Atendimento | Tipos e ordem dos atendimentos      |
| `/settings`         | Configurações         | Tema, cores, logo, credenciais WhatsApp |
| `/users`            | Usuários              | Gestão de permissões por empresa        |
| `/global-admin`     | Admin Global          | Gerenciamento de empresas (restrito)    |
| `/profile`          | Meu Perfil            | Dados pessoais do usuário logado        |

---

## Funcionalidades Principais

- **Dashboard** — Métricas de agentes ativos, conversas do dia, clientes e base de conhecimento
- **Agentes de IA** — Criação e configuração com temperatura, max tokens e tags
- **Chat** — Visualização de conversas (texto, áudio, imagem, documento, localização, contato)
- **Log de Mensagens** — Auditoria das mensagens salvas pelo fluxo UAZAPI → RabbitMQ → Supabase
- **Assistente IA** — Transcrição estruturada de áudio via Edge Function `transcricao-audio`, Gemini Files API e workflow n8n `ayvi_one_assistente_ia`; exige cliente na nova transcrição e permite vincular atendimento opcional filtrado por cliente, identificado por data/hora; na aba Histórico, o detalhe da transcrição exibe nos metadados também **Atendimento** (data/hora + tipo, mesmo formato do dropdown de vínculos) quando houver `attendance_id`; o card **Respostas do formulário** fica abaixo dos metadados e acima de **Áudio original**
- **Base de Conhecimento** — Artigos e FAQs categorizados com prioridade e idioma
- **Clientes (CRM)** — Cadastro com dados enriquecidos por IA (`clients_ai`): nome, cidade, estado, e-mail, esportes/interesses, tipo jogador/gestor, quadras, redes sociais, marketing. No detalhe do cliente, a aba **Dados** exibe **Respostas extraídas deste cliente** e a aba **Formulários** gerencia as perguntas por empresa do Cliente Info AI.
- **Tarefas (Kanban)** — Quadro drag-and-drop com @dnd-kit, visualização em lista, prioridades, datas de vencimento, lembretes e atribuição de responsáveis
- **Config. de Etapas** — Personalização dos status do Kanban (cores, ordem, tipo: ativo/concluído/cancelado)
- **Agenda** — Grid semanal de agendamentos com modal de criação/edição
- **Followup Automático** — Confirmação automática de agendamentos via WhatsApp com templates customizáveis
- **Google Calendar** — Integração OAuth para sincronização de agenda
- **Atendimentos** — Lista com colunas Cliente → Data → Tipo → Status; ações separadas **Visualizar** (somente leitura) e **Editar**; no detalhe/edição, vínculo opcional de transcrição do Assistente IA (lista filtrada pelo cliente, data em primeiro plano) com trecho do texto e atalho para abrir o histórico no Assistente IA
- **Usuários** — Gestão de permissões por empresa (admin / operator)
- **Configurações** — Tema, cores, logos e credenciais WhatsApp/UAZ API por empresa
- **Admin Global** — Gerenciamento de empresas e administradores (restrito a `global_admin`)
- **Perfil** — Edição de dados pessoais do usuário logado

---

## Arquitetura Multi-Tenant

A aplicação suporta **múltiplas empresas** com isolamento de dados via Supabase RLS:

| Perfil | Descrição |
|--------|-----------|
| `global_admin` | Administrador global — gerencia empresas e admins |
| `admin` | Admin de empresa — acesso completo à empresa |
| `operator` | Operador — acesso operacional à empresa |
| `company_client` | Cliente final — interage via WhatsApp/chat |

**Fluxo de autenticação:**

```
Login (Supabase Auth)
  ↓
Verificação: global_admin?
  ├─ Sim → GlobalAdminPage
  └─ Não → Carregar companies (CompanyContext)
              ↓
           Múltiplas companies?
             ├─ Sim → CompanySelectionPage
             └─ Não → Selecionar automaticamente
                         ↓
                      App com Sidebar + Header + View
```

O contexto da empresa selecionada é:
- Propagado via `CompanyContext` para todos os componentes
- Persistido no `localStorage` (`current_company_id`)
- Sincronizado no Supabase via RPC `set_current_company()`

---

## Ambientes DEV e PROD

O frontend contém as configurações dos dois ambientes Supabase em `lib/supabase.ts`.

| Ambiente | Project Ref |
| -------- | ----------- |
| DEV      | `jiwepyzvfzekftywwkxt` |
| PROD     | `tfkvgkkqpmafvczodnco` |

### Runtime (toggle para global_admin)

Usuários `global_admin` veem um toggle "Ambiente Supabase" na sidebar. Permite alternar entre DEV e PROD sem rebuild — útil para testes em produção.

- Estado persistido no `localStorage` (`AYVI_ENV`)
- Sem override salvo, o app usa PROD por padrão
- Ao trocar de ambiente, a página recarrega automaticamente
- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` podem sobrescrever os valores de PROD no build

### Branches GitHub

| Branch | Ambiente | Comando de deploy |
| ------ | -------- | ----------------- |
| `main` | PROD     | `./scripts/deploy-frontend-to-github.sh` (senha `PROD`) |
| `dev`  | DEV      | `./scripts/deploy-frontend-to-github.sh --branch dev`   |

> Ver skill completa em [`.agents/frontend.md`](../.agents/frontend.md)

---

## Testes

```bash
# Rodar testes em modo watch
npm test

# Execução única
npm run test:run

# Cobertura de código
npm run test:ci
```

| Arquivo                                | O que testa                       |
| -------------------------------------- | --------------------------------- |
| `pages/LoginPage.test.tsx`             | Componente de autenticação        |
| `services/globalAdminService.test.ts`  | Service de admin global           |
| `hooks/useGlobalAdmin.test.ts`         | Hook de permissão global_admin    |

---

## Deploy

Configurado para deploy na **Vercel**:

| Config          | Valor                         |
| --------------- | ----------------------------- |
| Build command   | `npm run build`               |
| Output dir      | `dist/`                       |
| SPA rewrite     | Todas as rotas → `index.html` |

---

## Design System

- **Dark mode** por padrão (`class="dark"` no `<html>`)
- **Fonte:** Manrope (Google Fonts) + Material Symbols (ícones)
- **Cores principais:**

| Token       | Cor               | Uso                         |
| ----------- | ----------------- | --------------------------- |
| `primary`   | `#3b82f6` (azul)  | Ações principais, links     |
| `secondary` | `#8b5cf6` (roxo)  | Destaques secundários       |
| Background  | `#0f172a` (slate) | Fundo das páginas           |
| Superfície  | `#1e293b` (slate) | Cards, modais, sidebar      |

- **Gradiente:** azul → roxo (135deg) — botões e elementos destacados

> Ver design system completo em [`.agents/design-system.md`](../.agents/design-system.md)

---

## Licença

Projeto privado — uso interno.
