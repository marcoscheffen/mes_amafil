# Skills disponíveis — Projeto MES (Amafil)

Antes de executar qualquer tarefa, identifique qual skill se aplica e carregue o arquivo correspondente.

---

## Índice de skills

| Skill | Arquivo | Comando | Quando usar |
|---|---|---|---|
| Regras de negócio MES | `mes.md` | `/mes` | OPs, apontamentos, perfis, solicitações |
| Backend API (Fastify) | `api.md` | `/api` | Rotas, middleware, plugins, jobs BullMQ |
| Frontend (Next.js PWA) | `frontend.md` | `/frontend` | Páginas, componentes, offline, PWA, auth client |
| Integração Protheus | `protheus.md` | `/protheus` | Jobs de sync, tabelas SC2/SC4/SG1, API REST |
| Banco de dados / Supabase | `supabase.md` | `/supabase` | Migrations, RLS, schemas, Drizzle ORM |
| Infraestrutura | `infra.md` | `/infra` | Docker Compose, Nginx, servidor, backup |
| Design System | `design-system.md` | `/design-system` | Cores, tokens CSS, componentes UI |
| README | `skill-readme.md` | `/readme` | Criar ou atualizar o README.md do projeto |
| Criar/melhorar skills | `skill-creator.md` | `/skill-creator` | Criar, iterar e otimizar skills com evals |
| Node-RED (flows, nodes, integração) | `nodered.md` | `/nodered` | Flows, nodes contrib, PostgreSQL, Dashboard, FTP |

---

## Stack do projeto

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 22 LTS + Fastify 5 + TypeScript |
| Frontend | Next.js 15 PWA + shadcn/ui + Tailwind |
| Banco | PostgreSQL 16 via Supabase self-hosted |
| ORM | Drizzle ORM |
| Filas | BullMQ + Redis 7 |
| Proxy | Nginx 1.26 |
| Orquestração | Docker Compose v2 |
| Deploy | Servidor on-premises Ubuntu 24.04 LTS |

## Documentos de referência

- [PRD Geral](../PRD/PRD_geral.md) — visão geral, perfis, OPs, design system
- [PRD Infra](../PRD/PRD_infra.md) — arquitetura, stack, segurança, deploy
- [PRD Hikrobot](../PRD/PRD_hikrobot.md) — slides de apresentação (SC3000, inspeção à prova de falhas)
- [Fluxo Geral](../Fluxo_geral.md) — diagrama de sistemas e atores
- [OP exemplo](../OP.md) — formulário físico que o MES substitui
