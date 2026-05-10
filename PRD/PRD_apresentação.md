# Sistema MES — Amafil
## Manufacturing Execution System

**Empresa:** Amafil  
**Versão:** 1.0  
**Data:** 10/05/2026

---

## O que é o MES?

O **MES (Manufacturing Execution System)** é uma plataforma digital que substitui os formulários físicos de Ordem de Produção e centraliza o controle do chão de fábrica em tempo real.

> Em vez de preencher papéis à mão e depois digitar no ERP, o operador registra tudo diretamente no tablet — e o sistema cuida do resto.

---

## O Problema Atual

Hoje, a Amafil controla a produção com formulários impressos gerados pelo TOTVS Protheus.

```
Protheus imprime o formulário
        ↓
Operador preenche à mão durante o turno
        ↓
Encarregado recolhe os papéis
        ↓
Alguém redigita os dados no ERP
```

Esse processo gera:

| Problema | Impacto |
|---|---|
| Retrabalho de digitação no ERP | Perda de tempo e risco de erro |
| Formulários perdidos ou ilegíveis | Dados de produção irrecuperáveis |
| Sem visibilidade em tempo real | PCP e gestão "no escuro" durante a produção |
| Dificuldade de rastreabilidade | Auditorias e análises complexas |
| Paradas sem registro imediato | Causa-raiz difícil de identificar depois |

---

## A Solução

O MES digitaliza todo o ciclo da Ordem de Produção, do recebimento ao fechamento.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                    │
│   Protheus emite OP  →  MES importa automaticamente              │
│                    ↓                                              │
│   PCP libera a OP  →  Operador vê no tablet                      │
│                    ↓                                              │
│   Operador aponta por turno  →  Dados salvos em tempo real       │
│                    ↓                                              │
│   OP finalizada  →  MES envia apontamento de volta ao Protheus   │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Resultado:** zero papéis, zero redigitação, rastreabilidade completa.

---

## Benefícios

### Para a Operação
- Tablet na linha de produção — início de turno em 3 toques
- Registro de paradas com motivo no momento em que ocorre
- Solicitações para Manutenção e Almoxarifado direto do tablet

### Para o PCP
- Visão em tempo real de todas as máquinas e OPs
- OEE calculado automaticamente por turno, máquina e período
- Alertas de paradas e erros de sincronização com o Protheus

### Para Manutenção e Almoxarifado
- Fila de solicitações organizada por prioridade e tempo de espera
- Histórico de paradas por máquina com categorização

### Para a Gestão
- Dashboard com KPIs consolidados (OEE, eficiência, perdas)
- Relatórios exportáveis por período
- Auditoria completa de todos os registros

---

## Ciclo de Vida da Ordem de Produção

```
[Protheus]
    │
    ▼
IMPORTADA ──► BLOQUEADA ──► LIBERADA ──► EM EXECUÇÃO ──► PENDENTE
                                               │               │
                                               │◄──────────────┘
                                               ▼
                                          FINALIZADA
                                               │
                                               ▼
                                          [Protheus]
```

| Status | Quem age | O que acontece |
|---|---|---|
| **Importada** | Sistema | OP recebida do Protheus, aguarda revisão do PCP |
| **Bloqueada** | PCP | OP visível no MES, não disponível para execução |
| **Liberada** | PCP | Operador pode iniciar a OP |
| **Em Execução** | Operador | Produção em andamento em uma máquina |
| **Pendente** | Operador | OP pausada — motivo obrigatório |
| **Finalizada** | Operador / PCP | Produção encerrada — dados enviados ao Protheus |

---

## Exemplo: Ordem de Produção Real

Abaixo um exemplo de OP que hoje chega em papel e passará a ser gerenciada digitalmente:

| Campo | Valor |
|---|---|
| Número | M01376.01.001 |
| Produto | FECULA HIDRATADA AMAFIL CX 21*500 PL |
| Lote | HS245 |
| Validade | 29/11/2026 |
| Quantidade | 1.500 CX |
| Máquina | 30 |
| Início Previsto | 29/04/2026 |
| Fim Previsto | 03/06/2026 |

**Componentes (BOM):**

| Código | Descrição | Quantidade |
|---|---|---|
| 7101021 | BOB. MASSA PARA TAPIOCA AMAFIL 500 G | 210,000 |
| 7110032 | CX MASSA TAPIOCA HIDRATA AMAFIL 21X500G | 1.500,000 |
| 7114024 | RIBBON RESINA 55 X 600 NET | 0,750 |

Todos esses dados chegam automaticamente do Protheus — o operador não precisa digitar nada.

---

## O Que o Operador Registra por Turno

Para cada turno de produção, o operador registra:

| Campo | Quando |
|---|---|
| Início do turno (data e hora) | Ao iniciar |
| Lote real da embalagem | Ao iniciar |
| Validade real da embalagem | Ao iniciar |
| Quantidade produzida | Ao finalizar o turno |
| Perdas (embalagem / reembalagem) | Ao finalizar o turno |
| Auxiliares envolvidos | Ao finalizar o turno |
| Paradas: hora início, fim e motivo | No momento da parada |

**Calculados automaticamente pelo sistema:**

| Métrica | Como é calculada |
|---|---|
| Tempo de produção | Hora Final − Hora Inicial − Total de Paradas |
| Tempo total de parada | Soma de todas as paradas do turno |
| Eficiência da OP | (Quantidade produzida ÷ Quantidade planejada) × 100% |
| OEE | Disponibilidade × Performance × Qualidade |

---

## Perfis de Usuário

Cada pessoa acessa um ambiente personalizado conforme sua função:

| Perfil | Tela inicial | Principais ações |
|---|---|---|
| **Operação** | OPs liberadas para a minha máquina | Iniciar turno, registrar parada, finalizar turno |
| **PCP** | Dashboard com status de todas as máquinas | Liberar OPs, visualizar dashboards, gerar relatórios |
| **Manutenção** | Fila de solicitações abertas | Atender chamados de manutenção da linha |
| **Almoxarifado** | Fila de solicitações abertas | Atender pedidos de material da linha |
| **Administração** | Dashboard gerencial com KPIs | Visão consolidada, relatórios, gestão de usuários |
| **TI** | Painel técnico | Cadastro de usuários, configuração da integração Protheus |
| **Master** | Painel multi-empresa | Administração total do sistema |

---

## Comunicação entre Setores

O operador pode abrir uma solicitação para Manutenção ou Almoxarifado sem sair da tela de produção:

```
Operador abre solicitação
        ↓
Sistema preenche automaticamente: máquina, número da OP, operador, data/hora
        ↓
Setor destino recebe na fila e inicia o atendimento
        ↓
Setor destino marca como concluído
        ↓
Operador confirma ou recusa (com justificativa)
```

Além das solicitações, o sistema possui **mensagens internas por canais**:

| Canal | Para quem |
|---|---|
| Geral | Toda a empresa |
| Manutenção | Equipe técnica |
| PCP | Planejamento |
| Urgentes | Todos — alta visibilidade |

---

## Integração com o TOTVS Protheus

O MES não substitui o Protheus — ele **se conecta** a ele:

```
Protheus (SIGAPCP)
    │
    │  OPs importadas automaticamente (polling a cada 5 min)
    ▼
Sistema MES
    │
    │  Apontamentos confirmados ao finalizar cada OP
    ▼
Protheus (SC2 atualizada: qtd produzida, datas reais, perdas)
```

| O Protheus envia | O MES devolve |
|---|---|
| Número da OP, produto, lote, validade | Data/hora real de início e fim |
| Quantidade planejada, máquina | Quantidade produzida por turno |
| Componentes (BOM) | Perdas registradas |
| Operações e prioridade | Status final da OP |

Campos originados do Protheus são **bloqueados para edição** no MES — garantindo consistência entre os dois sistemas.

---

## Arquitetura Resumida

```
┌─────────────────────────────────────────────────────┐
│            Tablets e PCs (Chão de Fábrica)           │
│         Aplicação Web PWA — instalável, offline-ok   │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS — rede interna fabril
┌──────────────────────▼──────────────────────────────┐
│              Servidor MES — On-Premises               │
│  ┌────────────────────┐  ┌──────────────────────┐   │
│  │  API Node.js       │  │  Supabase Self-Hosted │   │
│  │  (regras de        │  │  (Auth · Realtime ·   │   │
│  │   negócio, sync    │  │   Storage · API)      │   │
│  │   Protheus, filas) │  └──────────────────────┘   │
│  └────────────────────┘                              │
│  ┌─────────────────────────────────────────────┐    │
│  │          PostgreSQL 16                        │    │
│  │  (dados isolados por empresa — RLS)           │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────┐
│              TOTVS Protheus (ERP Externo)             │
└─────────────────────────────────────────────────────┘
```

**Destaques técnicos:**

| Aspecto | Decisão |
|---|---|
| **On-premises** | Servidor na própria fábrica — sem dependência de internet |
| **Offline-first** | Operador continua apontando mesmo sem Wi-Fi — sincroniza ao reconectar |
| **Multi-empresa** | Uma instalação suporta múltiplas unidades com dados completamente isolados |
| **Segurança** | TLS + JWT + isolamento por empresa no banco de dados |
| **PWA** | Instalável em tablets Android/iOS como aplicativo — sem loja de apps |

---

## Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 (PWA, Static Export) + Tailwind CSS + shadcn/ui |
| Backend | Node.js 22 + Fastify 5 + TypeScript |
| Banco de dados | PostgreSQL 16 (via Supabase self-hosted) |
| Autenticação | Supabase Auth (GoTrue) — JWT + MFA para Master |
| Filas / Jobs | BullMQ + Redis |
| OCR (fase 2) | Google Gemini Vision AI — leitura de lote e validade via câmera |
| Infraestrutura | Docker Compose + Nginx — Ubuntu Server 24.04 LTS |

---

## Requisitos de Hardware (Servidor)

| Componente | Mínimo | Recomendado |
|---|---|---|
| CPU | 4 cores (x86_64) | 8 cores |
| RAM | 8 GB | 16 GB |
| Disco SO | 50 GB SSD | 100 GB SSD |
| Disco dados | 200 GB SSD | 500 GB SSD |
| Rede | 1 Gbps | 1 Gbps |
| Energia | UPS | UPS com 1h de autonomia |

---

## Telas Previstas

| Tela | Perfil | Descrição |
|---|---|---|
| Login | Todos | Autenticação com email e senha |
| Dashboard | PCP, Admin | KPIs de produção em tempo real |
| Produção / Máquinas | PCP, Admin | Status em tempo real de todas as máquinas |
| Lista de OPs | PCP, Operação | OPs filtradas por status |
| Execução / Apontamento | Operação | Início, parada e finalização de turno |
| Paradas / Downtime | PCP, Admin, Manutenção | Análise de paradas por categoria (Pareto) |
| Solicitações | Todos | Envio e acompanhamento de solicitações |
| Relatórios | PCP, Admin, TI | BI e exportação XLSX/PDF |
| Mensagens | Todos | Comunicação interna por canais |
| Usuários | Master, Admin, TI | Cadastro e gestão de perfis |
| Configurações | TI, Master | Integração Protheus, parâmetros da empresa |

---

## Identidade Visual

O sistema segue a identidade da marca Amafil:

| Elemento | Referência |
|---|---|
| Verde primário | `#00AA4D` (marca Amafil) |
| Azul institucional | `#2B57A3` |
| Fonte principal | Inter |
| Fundo do sistema | Branco e cinza claro — tema exclusivamente claro |
| Dispositivos alvo | Tablets 10" (1280×800), smartphones, desktops |

---

## Escopo da Versão 1.0

| Incluído | Excluído |
|---|---|
| Gestão de OPs importadas do Protheus | Criação de OPs no MES |
| Apontamento digital por turno | Módulo financeiro |
| Registro de paradas e perdas | Gestão de compras |
| Solicitações entre setores | Controle de qualidade laboratorial |
| Dashboards de produção | Integração com outros ERPs |
| Mensagens internas por canal | — |
| Multi-empresa na mesma plataforma | — |
| Relatórios e exportação | — |

---

*Documento baseado em: PRD_geral.md · PRD_infra.md · PRD_design.md · Fluxo_geral.md · OP.md*
