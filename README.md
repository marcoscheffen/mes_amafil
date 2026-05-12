# MES Amafil

Sistema de Execução de Manufatura para a Amafil — substitui formulários físicos de Ordem de Produção e centraliza apontamentos, paradas e solicitações entre setores em uma plataforma web/PWA.

---

## Visão geral

O MES importa automaticamente as OPs do ERP TOTVS Protheus, permite ao operador apontar a produção digitalmente por turno e devolve os apontamentos ao Protheus ao finalizar cada OP. Inclui dashboards de produção em tempo real, mensagens internas por canais e validação de lote/validade por OCR via Google Gemini Vision AI.

**Estado atual:** protótipo funcional do frontend (React 19 + Vite) com todas as telas implementadas e dados mockados. Backend e banco de dados em fase de design (PRDs concluídos). O deploy de preview na Vercel usa SPA com `NavLink` no menu e `vercel.json` (rewrite para `index.html`); detalhes em [frontend/mes-amafil/README.md](frontend/mes-amafil/README.md).

---

## Estrutura do repositório

```
MES/
├── .agents/               # Skills de IA para automação de tarefas no projeto
├── Apresentação/
│   └── mes-amafil-presentation/  # App de apresentação/pitch do sistema (React + Vite)
├── frontend/
│   ├── mes-amafil/        # Protótipo do frontend MES (React 19 + Vite 6)
│   └── version/           # Versões anteriores e snapshots do frontend
├── github/                # README e materiais para o repositório GitHub
├── Imagens/               # Screenshots de telas e referências visuais
├── Informações/           # Documentos de máquinas, processos e fluxos (xlsx, pdf, md)
├── MES (pesquisa)/        # Pesquisas e referências sobre sistemas MES
├── PRD/                   # Documentos de requisitos do produto
├── CLAUDE.md              # Instruções para o agente de IA
├── Fluxo_geral.md         # Diagrama de sistemas e atores (Mermaid)
└── OP.md                  # Formulário físico de OP que o MES substitui
```

---

## Stack tecnológico

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend (protótipo) | React + Vite + TailwindCSS | 19 / 6 / 4 |
| Frontend (produção) | Next.js Static Export + PWA | 15 |
| Backend | Node.js + Fastify + TypeScript | 22 LTS / 5 |
| Banco de dados | PostgreSQL via Supabase self-hosted | 16 |
| ORM | Drizzle ORM | latest |
| Filas | BullMQ + Redis | latest / 7 |
| Proxy | Nginx | 1.26 |
| Orquestração | Docker Compose v2 | — |
| Deploy | Servidor on-premises Ubuntu | 24.04 LTS |
| Vision AI | Google Gemini (OCR de rótulos) | @google/genai |

---

## Perfis de usuário

| Perfil | Responsabilidade principal |
|---|---|
| Master | Acesso total, gestão de empresas |
| Administração | Visão gerencial, gestão de usuários |
| TI | Gestão de usuários e integração Protheus |
| PCP | Libera OPs, acompanha dashboards |
| Operação | Executa OPs, registra paradas e solicitações |
| Manutenção | Atende solicitações de manutenção |
| Almoxarifado | Atende solicitações de materiais |

---

## Documentação

| Documento | Descrição |
|---|---|
| [PRD Geral](PRD/PRD_geral.md) | Regras de negócio, perfis, OPs, apontamentos |
| [PRD Base](PRD/PRD_base.md) | Fundamentos e escopo do sistema |
| [PRD Infra](PRD/PRD_infra.md) | Arquitetura, stack, segurança, deploy, Docker |
| [PRD Design](PRD/PRD_design.md) | Guia de design e UX |
| [PRD Design System](PRD/PRD_design_system.md) | Tokens, cores, componentes UI |
| [PRD Apresentação](PRD/PRD_apresentação.md) | Roteiro e slides do pitch do sistema |
| [PRD Apresentação MI](PRD/PRD_apresentação_MI.md) | Variante da apresentação (Manufatura Industrial) |
| [PRD Hikrobot](PRD/PRD_hikrobot.md) | Integração com câmeras Hikrobot (inspeção visual) |
| [PRD DATEC](PRD/PRD_datec.md) | Integração com DATEC |
| [Fluxo Geral](Fluxo_geral.md) | Diagrama de sistemas e atores (Mermaid) |
| [OP Exemplo](OP.md) | Formulário físico substituído pelo MES |
| [Frontend README](frontend/mes-amafil/README.md) | Como rodar o protótipo do frontend |
| [Apresentação README](Apresentação/mes-amafil-presentation/README.md) | Como rodar o app de apresentação |
| [GitHub README](github/README.md) | README público do repositório |
| [Skills do agente](.agents/README.md) | Skills disponíveis para automação com IA |
