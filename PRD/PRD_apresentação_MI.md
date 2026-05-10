# PRD — Apresentação Markem-Imaje: Integração MES × CoLOS

**Empresa:** Amafil
**Interlocutor:** Soma Solution (distribuidor oficial Markem-Imaje)
**Versão:** 1.0
**Data:** 10/05/2026

---

## Sumário

1. [Contexto](#1-contexto)
2. [Arquitetura de Referência ISA-95](#2-arquitetura-de-referência-isa-95)
3. [CoLOS no Cenário Amafil](#3-colos-no-cenário-amafil)
4. [Integração MES ↔ CoLOS](#4-integração-mes--colos)
5. [Casos de Uso](#5-casos-de-uso)
6. [Valor Entregue](#6-valor-entregue)
7. [Próximos Passos](#7-próximos-passos)

---

## 1. Contexto

### 1.1 O projeto MES Amafil

A Amafil está desenvolvendo um **MES (Manufacturing Execution System)** para substituir os formulários físicos de Ordem de Produção e centralizar o controle do chão de fábrica em uma única plataforma digital.

O MES se integra diretamente ao **TOTVS Protheus (SIGAPCP)**, recebendo as OPs planejadas e devolvendo os apontamentos confirmados após cada produção.

| Item | Detalhe |
|---|---|
| Stack | Node.js + PostgreSQL + Next.js PWA |
| Deploy | On-premises — servidor físico na fábrica |
| ERP | TOTVS Protheus (integração bidirecional via REST) |
| Dispositivos | Tablets + painéis no chão de fábrica |
| Validação de embalagem | OCR via Google Gemini Vision AI (lote e validade) |

### 1.2 Equipamentos Markem-Imaje na Amafil

A Amafil opera impressoras Markem-Imaje em suas linhas de empacotamento para codificação de produtos (impressão de lote, validade, código de barras em itens, caixas e paletes).

Essa codificação é hoje configurada manualmente pelos operadores a cada troca de lote ou produto — processo suscetível a erros humanos que impactam rastreabilidade e conformidade.

---

## 2. Arquitetura de Referência ISA-95

O CoLOS se posiciona no **Nível 2 (Linha)** da hierarquia ISA-95, exatamente entre os dispositivos físicos e o MES, conforme o diagrama abaixo:

```
┌──────────────────────────────────────────────────────────────┐
│  NÍVEL 4 — EMPRESA                                           │
│  TOTVS Protheus (SIGAPCP)  —  ERP                            │
│  Ordens de Produção planejadas  /  Apontamentos confirmados  │
└──────────────────────────┬───────────────────────────────────┘
                           │  OPs importadas / apontamentos
┌──────────────────────────▼───────────────────────────────────┐
│  NÍVEL 3 — FÁBRICA                                           │
│  MES Amafil (Node.js + PostgreSQL)                           │
│  Gestão de OPs · Apontamentos · Paradas · Solicitações       │
└──────────────────────────┬───────────────────────────────────┘
                           │  Job data (produto / lote / validade / qtd)
┌──────────────────────────▼───────────────────────────────────┐
│  NÍVEL 2 — LINHA                                             │
│  CoLOS (Markem-Imaje)                                        │
│  Design de Mensagem · Gestão de Dados · Controle de Produção │
│  Desempenho de Impressoras · Mark & Read                     │
└──────────────────────────┬───────────────────────────────────┘
                           │  Comandos de impressão
┌──────────────────────────▼───────────────────────────────────┐
│  NÍVEL 1 — DISPOSITIVO                                       │
│  Impressoras Markem-Imaje (Inkjet · Laser · Termotransf.)    │
│  Scanners · Etiquetadoras · Visão · Balanças · CLP           │
└──────────────────────────┬───────────────────────────────────┘
                           │  Produto físico na esteira
┌──────────────────────────▼───────────────────────────────────┐
│  NÍVEL 0 — ESTEIRA                                           │
│  Item → Caixa → Palete                                       │
└──────────────────────────────────────────────────────────────┘
```

**Fluxo de dados:**
- Protheus → MES: OPs com produto, lote planejado e validade planejada
- MES → CoLOS: job de produção com lote real, validade real e quantidade
- CoLOS → Impressoras: configuração automática das mensagens de codificação
- CoLOS → MES: status de impressão e resultado de verificação (Mark & Read)

---

## 3. CoLOS no Cenário Amafil

### 3.1 Módulos relevantes para a integração

| Módulo CoLOS | Aplicação na Amafil | Prioridade |
|---|---|---|
| **Message Design** | Templates de impressão para cada produto (lote, validade, código de barras, EAN) | Alta |
| **Data Management** | Base de dados central com os dados de produto sincronizados do Protheus via MES | Alta |
| **Production Control (HMI)** | Painel na linha de produção — operador confirma o job iniciado pelo MES | Alta |
| **Printer Performance** | Monitoramento em tempo real do status das impressoras (alertas de falha) | Média |
| **Mark & Read** | Verificação óptica da codificação impressa — valida lote e validade na embalagem | Alta |
| **Packaging Integrity** | Verificação de completude de embalagens (cx com itens corretos) | Baixa (fase 2) |
| **Pallet Track / Product Tracking** | Rastreabilidade de palete para distribuição e conformidade | Baixa (fase 2) |

### 3.2 Fluxo de dados do produto na embalagem

```
Item (unidade)
  └── Codificação: lote + validade + código de barras
       └── Impressora MI (Nível 1) ← controlada pelo CoLOS (Nível 2)

Caixa (fardo / box)
  └── Codificação: EAN caixa + quantidade + lote
       └── Impressora MI ou etiquetadora ← controlada pelo CoLOS

Palete
  └── Etiqueta de palete: produto + lote + quantidade + destino
       └── Print & Apply (MI) ← controlada pelo CoLOS
```

---

## 4. Integração MES ↔ CoLOS

### 4.1 Visão geral

```
MES (início de turno)
  │
  ├─ Operador confirma: lote real + validade real
  │
  └─► CoLOS API: POST /jobs
        ├── código do produto
        ├── lote real
        ├── validade real
        ├── quantidade planejada
        └── número da OP

CoLOS
  ├── Seleciona template de mensagem (por código de produto)
  ├── Substitui variáveis: {LOTE} → lote real, {VALIDADE} → validade real
  └── Envia job para as impressoras da linha

Impressoras
  └── Imprimem automaticamente com os dados corretos

CoLOS → MES: status do job (ativo / pausado / concluído / erro)
CoLOS → MES: resultado do Mark & Read (aprovado / reprovado)
```

### 4.2 Dados trocados por evento

#### MES → CoLOS (início de turno)

| Campo | Origem no MES | Campo CoLOS |
|---|---|---|
| Código do produto | OP.C2_PRODUTO (Protheus) | `product_code` |
| Número da OP | OP.C2_NUM | `order_number` |
| Lote real | Registrado pelo operador ao iniciar turno | `batch` |
| Validade real | Registrado pelo operador ao iniciar turno | `best_before_date` |
| Quantidade planejada | OP.C2_QTDPLAN | `planned_quantity` |
| Linha / Máquina | OP.C2_LINHA | `line_id` |

#### CoLOS → MES (feedback contínuo)

| Evento CoLOS | Ação no MES |
|---|---|
| Job iniciado com sucesso | Confirmação visual ao operador |
| Impressora em falha | Alerta de parada → motivo pré-preenchido "Elétrica / Impressora" |
| Mark & Read: reprovado | Alerta ao operador → parada obrigatória para verificação |
| Job concluído | Registro de quantidade impressa confirmada no apontamento |

### 4.3 Mecanismo de integração

| Aspecto | Definição |
|---|---|
| Protocolo | REST API JSON (CoLOS Connect API) |
| Autenticação | Basic Auth ou Token (configurado por empresa no MES) |
| Direção principal | MES → CoLOS (envio do job ao iniciar turno) |
| Feedback | CoLOS → MES via Webhook ou Polling (a definir com MI/Soma) |
| Fallback | Se CoLOS indisponível: operador configura impressora manualmente; MES registra ocorrência |

### 4.4 Onde vive a configuração

A URL e as credenciais da API CoLOS são configuradas **por empresa** na tela de Configurações do MES (mesmo padrão da integração Protheus):

```
Configurações da empresa
  ├── Integração Protheus: URL, usuário, senha, intervalo de polling
  └── Integração CoLOS:    URL, token, linha(s) mapeada(s)
```

---

## 5. Casos de Uso

### UC-01: Início de turno com configuração automática das impressoras

**Atores:** Operador (MES), CoLOS, Impressoras MI

**Fluxo:**
1. Operador acessa OP liberada no MES e confirma início do turno
2. Operador informa lote real e validade real (ou confirma via OCR com câmera do tablet)
3. MES envia job ao CoLOS com os dados do produto
4. CoLOS aplica o template correto e configura as impressoras da linha automaticamente
5. Impressoras iniciam a codificação com os dados corretos — sem intervenção manual
6. Operador recebe confirmação no tablet: "Impressoras configuradas — produção liberada"

**Benefício:** Elimina erros de configuração manual (lote errado, validade errada gravados na embalagem).

---

### UC-02: Parada automática por falha de impressora

**Atores:** CoLOS, MES, Operador, Setor Manutenção

**Fluxo:**
1. CoLOS detecta falha em impressora da linha (tinta, sensor, comunicação)
2. CoLOS notifica o MES via Webhook
3. MES abre automaticamente um registro de parada na OP com motivo pré-preenchido ("Impressora — falha de equipamento")
4. Operador confirma a parada no tablet
5. MES gera solicitação automática ao setor Manutenção
6. Ao resolver, técnico conclui a solicitação → MES sinaliza para retomar a OP → CoLOS retoma o job

**Benefício:** Rastreabilidade completa da parada; tempo de resposta reduzido por acionamento automático da manutenção.

---

### UC-03: Validação do lote impresso via Mark & Read + OCR

**Atores:** CoLOS (Mark & Read), MES (OCR Gemini), Operador

**Fluxo:**
1. CoLOS verifica o código impresso via câmera de visão integrada (Mark & Read)
2. MES complementa a verificação com OCR via câmera do tablet (Google Gemini Vision AI)
3. Ambas as leituras são comparadas com os dados registrados na OP (lote real + validade real)
4. Se divergência: MES bloqueia finalização do turno e exige revisão do operador
5. Confirmação bem-sucedida: dados de verificação são gravados no apontamento

**Benefício:** Dupla camada de verificação; conformidade rastreável no apontamento da OP.

---

### UC-04: Troca de produto na mesma linha (changeover)

**Atores:** PCP, Operador, CoLOS

**Fluxo:**
1. PCP finaliza a OP atual no MES e libera a próxima OP para a mesma máquina
2. Operador encerra o turno da OP atual
3. Ao iniciar o turno da nova OP, MES envia novo job ao CoLOS com dados do novo produto
4. CoLOS altera automaticamente o template de mensagem nas impressoras da linha
5. Operador recebe confirmação: "Impressoras reconfiguradas para [produto]"

**Benefício:** Changeover de impressoras sem pausar a linha para configuração manual; reduz tempo de setup.

---

## 6. Valor Entregue

### 6.1 Para a Amafil

| Problema atual | Solução com MES + CoLOS integrados |
|---|---|
| Configuração manual das impressoras a cada troca de lote | Automação via job enviado pelo MES ao iniciar turno |
| Risco de impressão de lote/validade errados | Validação automática por Mark & Read + OCR |
| Paradas de impressora não rastreadas no sistema de produção | Paradas registradas automaticamente no apontamento da OP |
| Sem visibilidade do status das impressoras no dashboard de produção | Status das impressoras integrado ao painel MES em tempo real |
| Changeover lento e manual | Reconfiguração automática de impressoras na troca de OP |

### 6.2 Para a Markem-Imaje / Soma Solution

| Oportunidade | Detalhe |
|---|---|
| CoLOS como plataforma de software da linha | Posicionamento do CoLOS como camada obrigatória entre MES e impressoras |
| Upgrade de equipamentos | Linhas sem Mark & Read passam a ter justificativa de negócio clara para upgrade |
| Expansão para rastreabilidade de palete | Fase 2 abre oportunidade para CoLOS Pallet Track + Print & Apply |
| Referência de integração MES-CoLOS no mercado | Amafil como caso de referência para integração MES nacional × CoLOS |

---

## 7. Próximos Passos

| # | Ação | Responsável | Prazo |
|---|---|---|---|
| 1 | Mapear quais impressoras MI estão em cada linha da Amafil | Soma Solution + TI Amafil | — |
| 2 | Validar disponibilidade da CoLOS Connect API na versão instalada | Soma Solution | — |
| 3 | Definir formato do Webhook CoLOS → MES (ou polling) | Dev MES + Soma Solution | — |
| 4 | Criar templates de mensagem no CoLOS para os produtos Amafil | Operação Amafil + MI | — |
| 5 | Implementar endpoint `POST /colos/jobs` no MES | Dev MES | — |
| 6 | Teste integrado em ambiente de homologação | Dev MES + Soma Solution | — |
| 7 | Validar UC-03 (Mark & Read + OCR Gemini) em linha piloto | Operação + TI Amafil | — |
| 8 | Go-live integração MES ↔ CoLOS | Todos | — |

---

*Documento baseado em: PRD_geral.md · PRD_infra.md · CoLOS scenario (Markem-Imaje) · CoLOS Software Solutions overview · Soma Solution — Produtos MI*
