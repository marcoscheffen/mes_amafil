# PRD Infraestrutura — Sistema MES

**Versão:** 1.0
**Data:** 05/05/2026
**Base:** PRD_geral.md

---

## Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Servidor On-Premises](#3-servidor-on-premises)
4. [Banco de Dados — PostgreSQL](#4-banco-de-dados--postgresql)
5. [Backend — Node.js + Fastify](#5-backend--nodejs--fastify)
6. [Frontend — Next.js PWA](#6-frontend--nextjs-pwa)
7. [Supabase Self-Hosted](#7-supabase-self-hosted)
8. [Proxy Reverso — Nginx](#8-proxy-reverso--nginx)
9. [Orquestração — Docker Compose](#9-orquestração--docker-compose)
10. [Segurança](#10-segurança)
11. [Estratégia Offline](#11-estratégia-offline)
12. [Integração com o Protheus](#12-integração-com-o-protheus)
13. [Backup e Monitoramento](#13-backup-e-monitoramento)
14. [Ambientes](#14-ambientes)

---

## 1. Visão Geral da Arquitetura

### 1.1 Diagrama geral

```
┌─────────────────────────────────────────────────────────┐
│              DISPOSITIVOS (tablet / PC operador)         │
│          Browser — Next.js PWA (offline-capable)        │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS (rede local fabril)
┌────────────────────────▼────────────────────────────────┐
│              NGINX — Reverse Proxy (porta 443)           │
│              Certificado TLS interno (CA local)          │
└──────────────┬────────────────────────┬─────────────────┘
               │ /api                   │ /auth  /realtime  /storage  /rest
┌──────────────▼──────────┐  ┌─────────▼─────────────────┐
│  Node.js — Fastify API  │  │  Supabase Self-Hosted       │
│  porta 3001             │  │  (Docker Compose)           │
│                         │  │                             │
│  - Regras de negócio    │  │  - Kong API Gateway :8000   │
│  - Integração Protheus  │  │  - GoTrue (Auth)            │
│  - Jobs de sincronização│  │  - PostgREST                │
│  - WebHooks             │  │  - Realtime (WebSocket)     │
│  - Validações           │  │  - Storage                  │
└──────────────┬──────────┘  └─────────┬─────────────────┘
               │                       │
               └───────────┬───────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│          PostgreSQL 16 — banco de dados principal        │
│          Row Level Security (multi-tenant)               │
│          port 5432 (acesso apenas interno)               │
└─────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│          TOTVS Protheus (ERP externo)                    │
│          API REST — sincronização de OPs                 │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Princípios da arquitetura

| Princípio | Decisão |
|---|---|
| **On-premises** | Servidor físico na fábrica — sem dependência de cloud externa |
| **Self-hosted** | Supabase rodando localmente — soberania total dos dados |
| **Offline-first** | PWA com Service Worker — operação contínua mesmo sem conexão ao ERP |
| **Segurança em camadas** | TLS + JWT + RLS no PostgreSQL + firewall de rede |
| **Multi-tenant** | Row Level Security nativo no banco — isolamento por empresa |
| **Tecnologias consolidadas** | Node.js LTS + PostgreSQL + Docker — sem experimentação |

---

## 2. Stack Tecnológico

### 2.1 Decisões e justificativas

| Camada | Tecnologia | Versão alvo | Justificativa |
|---|---|---|---|
| **Runtime backend** | Node.js | 22 LTS | LTS com suporte longo, ecossistema maduro, excelente para I/O assíncrono |
| **Framework API** | Fastify | 5.x | 2-3× mais rápido que Express, schema-first, TypeScript nativo, low overhead — porta interna `3001` (PostgREST ocupa `:3000`) |
| **Linguagem** | TypeScript | 5.x | Segurança de tipos, autocompletar, menos bugs em produção |
| **Banco de dados** | PostgreSQL | 16 | ACID, RLS nativo, JSON/JSONB, extensível, padrão industrial |
| **BaaS self-hosted** | Supabase | **versão pinada** (ex: `v1.24.x`) | PostgreSQL + Auth + Realtime + API em stack Docker pronta — versão fixa evita quebras de atualização |
| **ORM / Query builder** | Drizzle ORM | latest | Type-safe, zero runtime overhead, SQL-first, compatible com Postgres |
| **Frontend** | Next.js | 15 | App Router, React 19, build tooling; deploy como **Static Export (SPA)** — sem SSR em produção |
| **Proxy reverso** | Nginx | 1.26 (stable) | Maduro, performático, amplamente documentado |
| **Orquestração** | Docker Compose | v2 | Simples para servidor único, sem overhead do Kubernetes |
| **Gerenciador de processos** | PM2 | latest | Reinício automático, logs, monitoring — complementa Docker |
| **Autenticação** | Supabase Auth (GoTrue) | — | JWT, refresh tokens, multi-tenant, sem implementar do zero |
| **Workers / Jobs** | BullMQ | latest | Filas robustas com Redis para jobs de sincronização com Protheus |
| **Cache / Filas** | Redis | 7.x | Sessões, cache de resposta, filas BullMQ |
| **Testes** | Vitest + Supertest | — | Rápido, compatível com TypeScript, unitários + integração |

### 2.2 Comparativo Fastify × Express

| Critério | Fastify | Express | Decisão |
|---|---|---|---|
| Performance | ~70k req/s | ~20k req/s | Fastify |
| TypeScript | Nativo | via @types | Fastify |
| Schema validation | Nativo (ajv) | Manual | Fastify |
| Ecossistema | Crescendo | Enorme | Express (histórico) |
| Async/await | Design-first | Retrocompatível | Fastify |
| **Decisão** | ✓ Adotado | — | **Fastify** |

---

## 3. Servidor On-Premises

### 3.1 Hardware mínimo recomendado (produção)

| Componente | Mínimo | Recomendado |
|---|---|---|
| CPU | 4 cores (x86_64) | 8 cores |
| RAM | 8 GB | 16 GB |
| Disco SO | 50 GB SSD | 100 GB SSD |
| Disco dados (PostgreSQL) | 200 GB SSD | 500 GB SSD |
| Rede | 1 Gbps | 1 Gbps |
| Redundância de energia | UPS | UPS com autonomia de 1h |

> **Por que SSD?** PostgreSQL é intensivo em I/O. SSD reduz latência de queries e WAL em ~10×.

### 3.2 Sistema operacional

| Item | Escolha |
|---|---|
| OS | Ubuntu Server 24.04 LTS |
| Justificativa | LTS de 5 anos, excelente suporte Docker, comunidade ampla |
| Atualizações | Automáticas apenas para patches de segurança (`unattended-upgrades`) |

### 3.3 Rede fabril

```
Internet / Protheus (ERP)
        │
    Firewall
        │
   Switch Core
   (rede fabril)
        │
   ┌────┴────┐
   │         │
Servidor   Tablets/PCs
MES        operadores
```

- O servidor MES fica na **rede interna** da fábrica
- Tablets dos operadores acessam via **Wi-Fi interno** (SSID dedicado)
- A saída para o Protheus é controlada via regra de firewall (apenas o servidor MES acessa o ERP)
- Nenhuma porta do MES fica exposta para a internet diretamente

---

## 4. Banco de Dados — PostgreSQL

### 4.1 Configuração

| Parâmetro | Valor | Motivo |
|---|---|---|
| Versão | PostgreSQL 16 | Suportado pelo Supabase self-hosted, LTS |
| Porta | 5432 (interna) | Não exposta externamente — acesso apenas via container |
| Encoding | UTF-8 | Suporte a caracteres especiais e JSONB |
| Timezone | **UTC** | Servidor em UTC; ajuste de timezone por empresa feito na camada de aplicação ao formatar timestamps para exibição |
| Max connections | 200 | Suficiente para carga da fábrica |
| Shared buffers | 25% da RAM | Regra padrão do PostgreSQL |

### 4.2 Row Level Security (Multi-tenant)

Cada tabela de dados possui a coluna `empresa_id`. A RLS garante que cada usuário só veja os dados da sua empresa — o isolamento é **no banco**, não apenas na aplicação.

```sql
-- Habilitar RLS em cada tabela
ALTER TABLE ordens_producao ENABLE ROW LEVEL SECURITY;

-- Policy: cada sessão só enxerga registros da sua empresa
CREATE POLICY empresa_isolation ON ordens_producao
  USING (empresa_id = current_setting('app.empresa_id')::uuid);

-- O middleware Node.js define a variável por requisição
-- SET app.empresa_id = '<uuid-da-empresa>'
```

**Benefício:** mesmo que haja um bug na aplicação, o banco rejeita queries cruzando empresas.

### 4.3 Estrutura de schemas

```
postgres/
├── public/           → tabelas de sistema (empresas, usuários)
├── tenant/           → tabelas multi-tenant com RLS (OPs, apontamentos, máquinas)
├── audit/            → log imutável de alterações (append-only)
└── integration/      → fila de sincronização com Protheus
```

#### Imutabilidade do schema `audit/`

O log de auditoria é garantido em duas camadas:

1. **Revogação de privilégios** — a role da aplicação não tem `UPDATE` nem `DELETE` no schema `audit/`:
   ```sql
   REVOKE UPDATE, DELETE ON ALL TABLES IN SCHEMA audit FROM app_role;
   ```

2. **Trigger append-only** — cada tabela auditada possui um trigger `AFTER INSERT OR UPDATE OR DELETE` com `SECURITY DEFINER` que insere no `audit.log` sem expor a função à role da aplicação.

```sql
CREATE TRIGGER trg_audit_ordens
  AFTER INSERT OR UPDATE OR DELETE ON tenant.ordens_producao
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();
```

Isso garante que mesmo um bug de aplicação não consiga apagar ou alterar registros históricos.

### 4.4 Extensões utilizadas

| Extensão | Uso |
|---|---|
| `uuid-ossp` | Geração de UUIDs como chaves primárias |
| `pg_cron` | Jobs agendados dentro do banco (limpeza, relatórios) |
| `pgaudit` | Auditoria nativa de queries |
| `unaccent` | Busca de texto sem considerar acentos |

---

## 5. Backend — Node.js + Fastify

### 5.1 Estrutura de projeto

```
api/
├── src/
│   ├── plugins/        → Fastify plugins (auth, db, redis)
│   ├── routes/         → Endpoints por módulo
│   │   ├── auth/
│   │   ├── ordens/
│   │   ├── apontamentos/
│   │   ├── maquinas/
│   │   ├── solicitacoes/
│   │   └── integracoes/
│   ├── services/       → Regras de negócio
│   ├── jobs/           → Workers BullMQ (sync Protheus)
│   ├── middlewares/    → Auth, tenant, validação
│   ├── schemas/        → JSON Schemas de entrada/saída (Fastify)
│   └── db/             → Drizzle schema + migrations
├── tests/
├── .env
└── package.json
```

### 5.2 Plugins Fastify utilizados

| Plugin | Função |
|---|---|
| `@fastify/helmet` | Headers de segurança HTTP |
| `@fastify/cors` | Controle de origem (apenas rede interna) |
| `@fastify/jwt` | Validação de tokens JWT |
| `@fastify/rate-limit` | Proteção contra abuso de endpoints |
| `@fastify/sensible` | Erros HTTP padronizados |
| `@fastify/swagger` | Documentação automática da API |

### 5.3 Criação do usuário Master

O usuário Master **não pode ser criado pela interface** — apenas via SQL direto, executado por um DBA com acesso ao container do banco:

```sql
-- Executar dentro do container db (via docker exec)
INSERT INTO public.users (id, email, password_hash, perfil, created_at)
VALUES (
  gen_random_uuid(),
  'master@amafil.local',
  crypt('senha-forte-inicial', gen_salt('bf', 12)),
  'master',
  now()
);
```

- A senha inicial deve ser trocada no primeiro acesso
- O acesso SSH ao servidor é restrito a IPs de administração (§10.4)
- MFA via TOTP (GoTrue) deve ser ativado para o perfil Master — configurado em `auth.config` com `MFA_ENABLED=true`
- Registrar procedimento de rotação de credencial semestral junto com `JWT_SECRET` (§10.3)

### 5.4 Hierarquia de perfis — aplicação no backend

A hierarquia de criação de usuários (PRD_geral §3.2) é aplicada em duas camadas:

1. **Middleware Fastify** — valida se o perfil do usuário autenticado tem permissão para criar o perfil solicitado:
   ```
   Master → pode criar: Admin
   Admin  → pode criar: TI, Manutenção, Almoxarifado, Operação, PCP
   TI     → pode criar: TI, Manutenção, Almoxarifado, Operação, PCP
   ```

2. **RLS no banco** — policy na tabela `public.users` verifica `app.user_perfil` (extraído do JWT) antes de permitir `INSERT`.

### 5.5 Middleware de tenant

Toda requisição autenticada passa pelo middleware que extrai o `empresa_id` e `user_perfil` do JWT e os injeta na sessão PostgreSQL:

```
Request → JWT validation → extract empresa_id + user_perfil → SET session → Route handler → Response
```

### 5.6 Jobs de sincronização (BullMQ)

| Job | Gatilho | Função |
|---|---|---|
| `sync-ops-protheus` | Polling a cada 5 min | Importa OPs Liberadas do Protheus |
| `confirm-op-protheus` | Evento: OP Finalizada | Envia apontamento de volta ao Protheus |
| `retry-failed-sync` | Automático (dead-letter) | Retenta sincronizações com falha |
| `cleanup-logs` | Diário (pg_cron) | Remove logs de sync com mais de 90 dias |

---

## 6. Frontend — Next.js PWA

### 6.1 Decisões

| Item | Escolha | Motivo |
|---|---|---|
| Framework | Next.js 15 | React 19, App Router, ecosistema maduro; utilizado pelo build tooling e PWA |
| Deploy mode | **Static Export (SPA)** | Servido pelo Nginx — sem servidor Node em produção. SSR desabilitado. Auth redirect tratado no cliente via Zustand + GoTrue SDK. |
| PWA | `next-pwa` + Service Worker | Operação offline, instalável em tablets |
| Estado global | Zustand | Leve, simples, TypeScript-friendly |
| UI components | shadcn/ui + Tailwind | Design system consistente, tokens CSS customizáveis |
| Ícones | Lucide React | Leve e consistente |
| Gráficos | Recharts | Maduro, composable, compatível com React 19 |
| Formulários | React Hook Form + Zod | Validação type-safe, integra com esquemas da API |

### 6.2 Telas previstas

| Tela | Perfil | Descrição |
|---|---|---|
| Login | Todos | Autenticação com email/senha |
| Dashboard | PCP, Admin | KPIs de produção em tempo real |
| Lista de OPs | PCP, Operação | OPs filtradas por status |
| Detalhes da OP | PCP, Operação | Cabeçalho + componentes (somente leitura) |
| Apontamento | Operação | Início/parada/finalização de turno |
| Registro de parada | Operação | Motivo + hora + solicitação de manutenção |
| Solicitações | Todos | Envio e acompanhamento |
| Atendimento | Manutenção, Almox | Lista e gestão de solicitações recebidas |
| Status das máquinas | PCP, Admin | Grid com status em tempo real |
| Usuários | Master, Admin, TI | Cadastro e gestão |
| Configurações | TI, Master | Integração Protheus, parâmetros da empresa |

### 6.3 Responsividade

- Design mobile-first: otimizado para tablet 10" (resolução 1280×800)
- Funcional em smartphones
- Funcional em desktop (PCP e gestão)
- Sem app nativo — instalação como PWA nos dispositivos da fábrica

---

## 7. Supabase Self-Hosted

### 7.1 Serviços do stack Docker

| Serviço | Função | Porta interna |
|---|---|---|
| `db` | PostgreSQL 16 | 5432 |
| `kong` | API Gateway | 8000 (http), 8443 (https) |
| `auth` | GoTrue — autenticação JWT | 9999 |
| `rest` | PostgREST — API automática do schema | 3000 |
| `realtime` | WebSocket para subscriptions | 4000 |
| `storage` | Gerenciamento de arquivos/blobs | 5000 |
| `studio` | Interface admin (apenas dev/staging) | 3001 (container) → mapeado para host `:3002` em dev para não colidir com Fastify |

### 7.2 O que é usado do Supabase no MES

| Recurso | Uso |
|---|---|
| **PostgreSQL** | Banco principal (toda a lógica fica aqui) |
| **GoTrue** | Emissão e validação de JWT, refresh tokens |
| **Realtime** | Subscriptions para atualização em tempo real do status das OPs e máquinas |
| **Storage** | Armazenamento de logos de empresa, arquivos de solicitações |
| **PostgREST** | Consultas simples de CRUD (leitura de listas, dashboards) |

### 7.3 O que NÃO é usado

| Recurso | Motivo |
|---|---|
| Supabase Edge Functions | Usamos Node.js/Fastify para a lógica de negócio |
| Logflare / Analytics | Não necessário — monitoramento via Prometheus/Grafana |
| imgproxy | Não há processamento de imagens |

### 7.4 Variáveis de ambiente críticas

```env
POSTGRES_PASSWORD=<senha-forte-gerada>
JWT_SECRET=<string-aleatoria-64-chars>
ANON_KEY=<jwt-gerado>
SERVICE_ROLE_KEY=<jwt-gerado>
SUPABASE_PUBLIC_URL=https://mes.amafil.local
API_EXTERNAL_URL=https://mes.amafil.local
SITE_URL=https://mes.amafil.local
```

> Todas as chaves são geradas no provisionamento e nunca commitadas em git.

---

## 8. Proxy Reverso — Nginx

### 8.1 Roteamento

| Path | Destino | Obs |
|---|---|---|
| `/api/*` | Node.js Fastify `:3001` | Regras de negócio customizadas |
| `/auth/*` | GoTrue `:9999` | Login, refresh token |
| `/realtime/*` | Supabase Realtime `:4000` | WebSocket — requer Upgrade/Connection |
| `/storage/*` | Supabase Storage `:5000` | Upload/download de arquivos |
| `/rest/*` | PostgREST `:3000` | CRUD automático para dashboards e listas |
| `/*` (resto) | Next.js SPA (arquivos estáticos) | Servido diretamente pelo Nginx |

### 8.2 TLS na rede interna

```
CA interna (criada no provisionamento)
    └── Certificado para mes.amafil.local
         └── Instalado nos dispositivos via MDM ou manualmente
```

- Protocolo mínimo: TLS 1.2
- Protocolo preferido: TLS 1.3
- Sem redirecionamento público — acesso apenas na rede interna

### 8.3 Headers de segurança via Nginx

```nginx
add_header Strict-Transport-Security "max-age=31536000" always;
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options SAMEORIGIN;
add_header Referrer-Policy no-referrer-when-downgrade;
```

---

## 9. Orquestração — Docker Compose

### 9.1 Serviços e dependências

```yaml
services:
  db:           # PostgreSQL — serviço raiz
  redis:        # BullMQ + cache de sessão
  kong:         # API Gateway Supabase (depende de db)
  auth:         # GoTrue (depende de db)
  rest:         # PostgREST (depende de db)
  realtime:     # Supabase Realtime (depende de db)
  storage:      # Supabase Storage (depende de db)
  api:          # Node.js Fastify porta 3001 (depende de db, redis)
  nginx:        # Proxy reverso (depende de api, kong)
```

#### Health checks obrigatórios

Todos os serviços críticos devem declarar `healthcheck` para evitar race condition no startup:

```yaml
db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 10s
    timeout: 5s
    retries: 5

redis:
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5

api:
  depends_on:
    db:
      condition: service_healthy
    redis:
      condition: service_healthy
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"]
    interval: 15s
    timeout: 5s
    retries: 3
```

### 9.2 Volumes persistentes

| Volume | Conteúdo |
|---|---|
| `db-data` | Dados do PostgreSQL |
| `redis-data` | Dados do Redis (filas BullMQ) |
| `storage-data` | Arquivos do Supabase Storage |
| `nginx-certs` | Certificados TLS |

#### Persistência do Redis

Redis é usado para filas BullMQ (jobs de sync com Protheus). Jobs pendentes **não devem ser perdidos** em caso de restart. Configuração obrigatória:

```yaml
redis:
  command: redis-server --appendonly yes --appendfsync everysec
  volumes:
    - redis-data:/data
```

`appendonly yes` — AOF (Append Only File) ativa persistência por log de operações.
`appendfsync everysec` — flush a cada segundo (equilíbrio entre segurança e performance).

### 9.3 Restart policy

Todos os serviços com `restart: unless-stopped` — reiniciam automaticamente após falha ou reboot do servidor.

### 9.4 Limites de recursos (recomendado)

| Serviço | CPU limit | Memory limit |
|---|---|---|
| db | 2 CPUs | 4 GB |
| api (Fastify) | 1 CPU | 1 GB |
| redis | 0.5 CPU | 512 MB |
| kong + auth + rest | 1 CPU | 1 GB |
| realtime | 0.5 CPU | 512 MB |
| nginx | 0.5 CPU | 256 MB |

---

## 10. Segurança

### 10.1 Camadas de segurança

```
Camada 1: Rede        → Firewall (apenas rede interna acessa o MES)
Camada 2: Transporte  → TLS 1.3 obrigatório em todas as conexões
Camada 3: API         → JWT + rate-limit + headers de segurança (Helmet)
Camada 4: Aplicação   → Validação de entrada com Zod/JSON Schema
Camada 5: Banco       → Row Level Security (RLS) por empresa
Camada 6: Auditoria   → pgaudit + log imutável de alterações
```

### 10.2 Autenticação e tokens

| Item | Decisão |
|---|---|
| Tipo de token | JWT (access + refresh) |
| Expiração do access token | 15 minutos |
| Expiração do refresh token | 7 dias |
| Refresh rotation | Ativado (novo refresh a cada uso) |
| Algoritmo | HS256 (simétrico — chave interna) |
| Armazenamento no cliente | HttpOnly cookie (refresh) + memória (access) |
| **MFA (perfil Master)** | TOTP via GoTrue — ativar com `MFA_ENABLED=true` e `MFA_TOTP_ENABLED=true` nas variáveis do serviço `auth`. Aplicativo autenticador (Google Authenticator, Authy). Recomendado também para Admin. |

### 10.3 Gestão de segredos

- Nenhuma senha ou chave no código-fonte
- Arquivo `.env` fora do repositório git (`.gitignore`)
- `.env` com permissão `600` no servidor
- Rotação de `JWT_SECRET` e senhas a cada 6 meses (procedimento documentado)

### 10.4 Controle de acesso à rede

| Serviço | Acessível de | Bloqueado para |
|---|---|---|
| Nginx (443) | Rede interna fabril | Internet pública |
| PostgreSQL (5432) | Containers Docker | Qualquer host externo |
| Redis (6379) | Containers Docker | Qualquer host externo |
| Supabase Studio | Apenas localhost | Rede interna, internet |
| SSH | IPs de administração | Resto |

### 10.5 Política de senhas

- Mínimo 12 caracteres
- Obrigatório: maiúsculas, minúsculas, números, símbolo
- Hash: bcrypt com cost factor 12
- Bloqueio após 5 tentativas consecutivas (5 minutos)

---

## 11. Estratégia Offline

### 11.1 Cenário coberto

O servidor MES está na rede interna. O **risco real de "offline"** é:
- Queda de Wi-Fi no tablet do operador
- Servidor MES temporariamente indisponível (manutenção, reinício)

### 11.2 Arquitetura offline no cliente (PWA)

```
Service Worker (SW)
├── Cache estratégico de assets (JS, CSS, ícones) → Cache-first
├── Cache de dados recentes (lista de OPs, máquinas) → Stale-while-revalidate
└── Sync Queue (IndexedDB)
     └── Operações executadas offline → enviadas ao servidor quando volta a conexão
```

### 11.3 Operações suportadas offline

| Operação | Offline | Comportamento |
|---|---|---|
| Visualizar OPs carregadas | ✓ | Cache local |
| Iniciar turno | ✓ | Salvo no IndexedDB → sync ao reconectar |
| Registrar parada | ✓ | Salvo no IndexedDB → sync ao reconectar |
| Finalizar turno | ✓ | Salvo no IndexedDB → sync ao reconectar |
| Ver dashboard em tempo real | ✗ | Exibe dados do cache + aviso "modo offline" |
| Enviar solicitação | ✓ | Salvo na fila → enviado ao reconectar |

### 11.4 Conflito de dados

- Apontamentos são **append-only** — não há conflito de edição concorrente
- Timestamps de todas as operações são gerados no **cliente** (com hora local em UTC) e validados no servidor
- O servidor aceita apontamentos com timestamp no passado desde que: (a) a OP ainda não esteja Finalizada e (b) o timestamp seja posterior ao `inicio_turno` registrado para aquela sessão. Não há limite fixo de horas — o critério é a coerência com o turno em aberto.

---

## 12. Integração com o Protheus

### 12.1 Componentes no MES

```
BullMQ Job: sync-ops-protheus
├── Roda a cada 5 minutos
├── Consulta API REST do Protheus: GET /api/ordens?status=Liberada
├── Compara com OPs já importadas (por número de OP)
├── Insere novas OPs na tabela integration.op_importadas
└── Notifica via Realtime → PCP vê nova OP na lista

BullMQ Job: confirm-op-protheus
├── Disparado quando OP muda para status Finalizada
├── Monta payload com apontamentos consolidados
├── POST /api/ordens/{id}/confirmacao no Protheus
└── Registra resposta (sucesso / erro) em integration.sync_log
```

### 12.2 Resiliência da integração

| Situação | Comportamento |
|---|---|
| Protheus indisponível | Job falha → BullMQ agenda retry com backoff exponencial |
| Erro de validação no Protheus | Log do erro + notificação para perfil PCP |
| OP duplicada (já importada) | Ignorada (upsert por número de OP) |
| Timeout na requisição | Timeout de 10s → falha gerenciada → retry |

### 12.3 Configuração por empresa

Cada empresa cadastra no MES:
- URL base da API Protheus
- Credenciais (Basic Auth ou Token)
- Intervalo de polling (padrão: 5 min)
- Filial Protheus (para filtrar OPs da empresa)

---

## 13. Backup e Monitoramento

### 13.1 Backup do PostgreSQL

| Item | Definição |
|---|---|
| Ferramenta | `pg_dump` via script bash + cron |
| Frequência | Diário às 02h |
| Retenção local | 7 dias no próprio servidor |
| Retenção remota | 30 dias em storage externo (HD ou NAS da empresa) |
| Formato | Dump comprimido (.dump) |
| Teste de restore | Mensal (procedimento documentado) |

```bash
# Script de backup (exemplo)
pg_dump -Fc -h localhost -U postgres mes_db > backup_$(date +%Y%m%d).dump
```

### 13.2 Monitoramento (fase 2)

| Ferramenta | Função |
|---|---|
| Prometheus | Coleta de métricas (Node.js, PostgreSQL, sistema) |
| Grafana | Dashboards de saúde da infraestrutura |
| Uptime Kuma | Alertas de serviços offline (email/Telegram) |
| pgBadger | Análise de queries lentas (PostgreSQL) |

### 13.3 Logs

| Serviço | Destino dos logs |
|---|---|
| Node.js (Fastify) | Stdout → Docker log driver → arquivo rotacionado |
| PostgreSQL | `pg_log/` com rotação semanal |
| Nginx | `/var/log/nginx/` com rotação diária |
| Sync Protheus | Tabela `integration.sync_log` no banco |

---

## 14. Ambientes

### 14.1 Estrutura de ambientes

| Ambiente | Onde roda | Banco | Protheus |
|---|---|---|---|
| **Desenvolvimento** | Máquina do dev (Docker local) | PostgreSQL local | Mock / Protheus de homologação |
| **Staging** | Servidor MES (namespace separado) | Banco isolado (`mes_staging`) | Protheus de homologação |
| **Produção** | Servidor MES | Banco principal (`mes_prod`) | Protheus de produção |

### 14.2 Variáveis por ambiente

```
.env.development   → desenvolvimento local
.env.staging       → homologação
.env.production    → produção (no servidor, fora do git)
```

### 14.3 Processo de deploy

```
1. Developer faz push para branch feature/
2. Pull Request → revisão de código
3. Merge para main → deploy automático em staging
4. QA valida em staging
5. Tag de release → deploy manual em produção
6. Deploy: docker compose pull && docker compose up -d
```

---

## Resumo das decisões-chave

| Decisão | Alternativa descartada | Motivo da escolha |
|---|---|---|
| Node.js + Fastify (porta 3001) | Python/Django, Go | Ecossistema JS unificado com o frontend, performance superior ao Express |
| Supabase self-hosted (versão pinada) | Banco puro / Firebase | Auth + Realtime + Storage prontos, sem vendor lock-in cloud |
| PostgreSQL UTC + timezone na aplicação | Timezone fixo no banco | Suporte correto a multi-empresa com fusos distintos |
| Audit schema append-only (trigger + REVOKE) | Só pgaudit | Imutabilidade garantida no banco, não apenas na aplicação |
| Docker Compose | Kubernetes | Complexidade desnecessária para um único servidor |
| Next.js Static Export (sem SSR) | SSR / App nativo | Deploy via Nginx, sem servidor Node em produção, instalável como PWA |
| BullMQ + Redis (AOF persistente) | Cron simples | Retry automático, dead-letter, jobs não perdidos em restart |
| On-premises | Cloud (AWS/GCP) | Soberania de dados, funcionamento sem internet, custo previsível |
| MFA TOTP para Master (GoTrue) | Sem MFA | Perfil de acesso total — autenticação reforçada obrigatória |
