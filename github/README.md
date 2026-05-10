# MES Amafil

Sistema de Execução de Manufatura (MES) desenvolvido para a **Amafil**. Substitui formulários físicos de Ordem de Produção e centraliza apontamentos de produção, paradas e solicitações entre setores em uma plataforma web com suporte a operação offline (PWA).

---

## O que o sistema faz

- Importa Ordens de Produção automaticamente do ERP TOTVS Protheus (SIGAPCP)
- Permite ao operador apontar início, paradas e finalização de turno digitalmente
- Registra perdas, auxiliares e motivos de parada em tempo real
- Devolve os apontamentos ao Protheus ao finalizar cada OP
- Oferece dashboards de produção para PCP, Manutenção e Gestão
- Valida lote e validade da embalagem via OCR com Google Gemini Vision AI
- Suporta mensagens internas por canais (Geral, Manutenção, PCP, Urgentes)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend (protótipo) | React 19 + Vite 6 + TailwindCSS 4 |
| Frontend (produção) | Next.js 15 Static Export + PWA |
| Backend | Node.js 22 LTS + Fastify 5 + TypeScript |
| Banco de dados | PostgreSQL 16 (Supabase self-hosted) |
| ORM | Drizzle ORM |
| Filas | BullMQ + Redis 7 |
| Proxy reverso | Nginx 1.26 |
| Orquestração | Docker Compose v2 |
| Servidor | Ubuntu 24.04 LTS (on-premises) |

---

## Estado atual

| Módulo | Status |
|---|---|
| Frontend — protótipo (todas as telas) | Implementado |
| App de apresentação/pitch | Implementado |
| PRDs (geral, infra, design, integração) | Concluídos |
| Backend (API Fastify + BullMQ) | Em design |
| Banco de dados (schemas + RLS) | Em design |
| Integração Protheus | Em design |
| Deploy Docker Compose | Em design |

---

## Perfis de usuário

Master · Administração · TI · PCP · Operação · Manutenção · Almoxarifado

Cada perfil possui tela inicial, navegação e permissões específicas. Dados completamente isolados por empresa (multi-tenant via RLS no PostgreSQL).

---

## Projeto privado — uso interno Amafil
