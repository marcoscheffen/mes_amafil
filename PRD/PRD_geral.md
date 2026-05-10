# PRD Geral — Sistema MES (Manufacturing Execution System)

**Empresa:** Amafil
**Versão:** 1.0
**Data:** 05/05/2026

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Estrutura Multi-empresa](#2-estrutura-multi-empresa)
3. [Usuários e Permissões](#3-usuários-e-permissões)
4. [Entidades do Sistema](#4-entidades-do-sistema)
5. [Ordens de Produção](#5-ordens-de-produção)
6. [Integração com TOTVS Protheus](#6-integração-com-totvs-protheus)
7. [Apontamento de Produção](#7-apontamento-de-produção)
8. [Solicitações entre Setores](#8-solicitações-entre-setores)
9. [Design System](#9-design-system)
10. [Requisitos Não-Funcionais](#10-requisitos-não-funcionais)
11. [Ambientes por Perfil](#11-ambientes-por-perfil)

---

## 1. Visão Geral

### 1.1 Objetivo

Criar um sistema MES (Manufacturing Execution System) para monitoramento e controle em tempo real dos processos de fabricação da Amafil, substituindo os formulários físicos de Ordem de Produção e centralizando os apontamentos de produção, paradas e solicitações entre setores em uma única plataforma digital.

### 1.2 Problema atual

Atualmente a Amafil utiliza formulários impressos gerados pelo ERP TOTVS Protheus para controle da produção. Os operadores preenchem manualmente dados de início, fim, quantidade produzida, perdas e paradas. Esse processo gera:

- Retrabalho de digitação no ERP após a produção
- Risco de perda ou ilegibilidade dos formulários
- Ausência de visibilidade em tempo real do chão de fábrica
- Dificuldade de rastreabilidade e auditoria

### 1.3 Solução proposta

Um sistema web/mobile que:

- Importa automaticamente as Ordens de Produção do Protheus
- Permite ao operador apontar a produção digitalmente por turno
- Registra paradas, perdas e auxiliares em tempo real
- Devolve os apontamentos ao Protheus ao finalizar cada OP
- Oferece dashboards de acompanhamento para PCP, Manutenção e Gestão
- Valida lote e validade da embalagem via OCR com Google Gemini Vision AI
- Disponibiliza mensagens internas por canais (Geral, Manutenção, PCP, Urgentes)

### 1.4 Escopo

| Incluído | Excluído |
|---|---|
| Gestão de OPs importadas do Protheus | Criação de OPs no MES |
| Apontamento de produção por turno | Módulo financeiro |
| Registro de paradas e perdas | Gestão de compras |
| Solicitações entre setores | Controle de qualidade laboratorial |
| Dashboards de produção | Integração com outros ERPs |
| Multi-empresa na mesma plataforma | |

---

## 2. Estrutura Multi-empresa

- A plataforma suporta múltiplas empresas cadastradas em um único sistema
- Cada empresa possui seus próprios usuários, setores, máquinas e OPs
- Os dados de uma empresa são completamente isolados das demais
- O vínculo entre usuário e empresa é gerenciado pelo Master, Administrador ou TI
- Um mesmo usuário pode ser vinculado a mais de uma empresa

---

## 3. Usuários e Permissões

### 3.1 Perfis de usuário

| Perfil | Descrição |
|---|---|
| **Master** | Acesso total ao sistema e a todas as empresas. Criado via SQL direto. |
| **Desenvolvedor** | Acesso a todos os usuários e empresas conforme vínculo definido pelo Master |
| **Administração** | Criado exclusivamente pelo Master. Acesso administrativo da empresa |
| **TI** | Pode criar usuários dos perfis: Manutenção, Almoxarifado, Operação, PCP e TI |
| **PCP** | Planejamento e Controle de Produção. Gerencia OPs e visualiza dashboards |
| **Manutenção** | Acesso às funções de manutenção e atendimento de solicitações |
| **Almoxarifado** | Acesso às funções de almoxarifado e atendimento de solicitações |
| **Operação** | Execução de ordens de produção e envio de solicitações |

### 3.2 Hierarquia de criação de usuários

```
Master
 └── Administração          ← só o Master pode criar
      └── TI, Manutenção, Almoxarifado, Operação, PCP
TI
 └── Manutenção, Almoxarifado, Operação, PCP, TI
```

### 3.3 Regras de acesso

- O usuário **Master** só pode ser criado via SQL direto no banco de dados
- A autenticação do Master deve ser criteriosamente segura (MFA recomendado)
- O Master pode criar, editar e excluir usuários e empresas
- Todo usuário criado deve registrar **quem criou** e **quando**
- O registro de auditoria deve ser mantido em tabela separada no banco de dados
- O registro deve ser atualizado a cada edição ou exclusão de usuário

### 3.4 Permissões por funcionalidade

| Funcionalidade | Master | Admin | TI | PCP | Operação | Manutenção | Almox |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Criar empresas | ✓ | — | — | — | — | — | — |
| Criar usuários | ✓ | ✓ | ✓ | — | — | — | — |
| Visualizar OPs | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Liberar OPs | ✓ | ✓ | — | ✓ | — | — | — |
| Executar OPs | ✓ | — | — | — | ✓ | — | — |
| Ver dashboards | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| Enviar solicitações | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Atender solicitações | — | — | ✓ | ✓ | — | ✓ | ✓ |
| Config. integração | ✓ | — | ✓ | — | — | — | — |

---

## 4. Entidades do Sistema

### 4.1 Empresa

Entidade raiz. Cada empresa possui:
- Razão social, CNPJ, logo
- Setores vinculados
- Máquinas cadastradas
- Usuários vinculados
- Configuração de integração com o Protheus (URL, credenciais)

### 4.2 Setores

| Setor | Sigla | Função no sistema |
|---|---|---|
| Planejamento e Controle de Produção | PCP | Gerencia e libera OPs |
| Operação | — | Executa OPs |
| Manutenção | — | Atende solicitações de manutenção |
| Almoxarifado | — | Atende solicitações de materiais |
| Tecnologia da Informação | TI | Administra usuários e integração |
| Administração | — | Visão gerencial |

### 4.3 Máquinas

Cada máquina possui:
- Código (ex: `30`)
- Nome / tipo
- Setor vinculado (Operação)
- Status atual: Operando / Parada / Manutenção / Offline

| Tipo de Máquina |
|---|
| Empacotadora |
| Empacotadora + Enfardadeira |
| Ensacadeira |
| Costuradeira |
| Coladeira |

---

## 5. Ordens de Produção

### 5.1 Ciclo de vida

```
[Protheus] → IMPORTADA → BLOQUEADA → LIBERADA → EM EXECUÇÃO → PENDENTE → FINALIZADA → [Protheus]
                                                      ↑__________________|
```

| Status | Quem define | Descrição |
|---|---|---|
| Importada | Sistema (automático) | OP recebida do Protheus, ainda não revisada |
| Bloqueada | PCP | OP disponível no MES mas não liberada para execução |
| Liberada | PCP | OP disponível para o operador iniciar |
| Em Execução | Operador | OP sendo executada em uma máquina |
| Pendente | Operador | OP pausada — requer registro obrigatório do motivo |
| Finalizada | Operador / PCP | OP concluída — dados enviados ao Protheus |

### 5.2 Dados da OP (cabeçalho)

Campos oriundos do Protheus — **somente leitura no MES**:

| Campo | Descrição | Exemplo |
|---|---|---|
| Número da OP | Identificador único | M01376.01.001 |
| Código do Produto | Código interno | 10.206.219 |
| Código de Barras | EAN/código de barras | 7896035990101 |
| Descrição | Nome completo do produto | FECULA HIDRATADA AMAFIL CX 21*500 PL |
| Emissão | Data de emissão no Protheus | 28/04/2026 |
| Fabricação | Data prevista de início da produção | 29/04/2026 |
| Início Previsto | Data prevista de início | 29/04/2026 |
| Fim Previsto | Data prevista de conclusão | 03/06/2026 |
| Operações | Operação principal | 01-PROD FECULA HIDRAT |
| Lote | Lote planejado | HS245 |
| Validade | Data de validade do produto | 29/11/2026 |
| Quantidade | Quantidade planejada | 1.500 CX |
| Unidade | Unidade de medida | CX |
| Máquina | Máquina planejada | 30 |
| Prioridade | Prioridade de execução | 500 |
| Pallet | Configuração do pallet | 72 CX |
| Observações | Campo livre do Protheus | DIA |

### 5.3 Componentes da OP (BOM)

Lista de materiais importada do Protheus (tabela SG1):

| Campo | Descrição |
|---|---|
| Código | Código do componente |
| Descrição | Nome do componente |
| Lote | Lote do componente (se rastreável) |
| Quantidade | Quantidade necessária |

### 5.4 Regras de negócio

- O **PCP** libera as OPs importadas do Protheus
- O **operador** só pode iniciar OPs com status **Liberada**
- Uma máquina só pode ter **uma OP Em Execução** por vez
- Ao iniciar uma OP, o operador deve confirmar a máquina e registrar o início do turno
- OPs no status **Pendente** exigem registro obrigatório do motivo da parada
- A OP pode conter múltiplos turnos de produção antes de ser finalizada
- A finalização envia os dados de apontamento ao Protheus

---

## 6. Integração com TOTVS Protheus

### 6.1 Visão geral

O TOTVS Protheus gera as Ordens de Produção pelo módulo **SIGAPCP**. O MES consome essas OPs automaticamente, elimina o formulário físico e devolve os apontamentos ao Protheus ao finalizar cada OP.

```
Protheus (SIGAPCP) ──► MES (importação automática) ──► Operador (apontamento digital) ──► Protheus (confirmação)
```

### 6.2 Dados recebidos do Protheus

| Campo na OP | Tabela/Campo Protheus |
|---|---|
| Número da OP | SC2.C2_NUM |
| Código do Produto | SC2.C2_PRODUTO |
| Código de Barras | SB1 (cadastro do produto) |
| Data de Emissão | SC2.C2_EMISSAO |
| Data de Fabricação / Início | SC2.C2_DATPRI |
| Data Prevista de Fim | SC2.C2_DATPRF |
| Lote planejado | SC2.C2_LOTECTL |
| Validade planejada | SC2.C2_DTVLD |
| Quantidade Planejada | SC2.C2_QTDPLAN |
| Unidade de Medida | SB1 (cadastro do produto) |
| Máquina / Linha | SC2.C2_LINHA |
| Prioridade | SC2.C2_PRIOR |
| Observações | SC2.C2_OBS |
| Operações | SC4 (sequência de operações) |
| Componentes (BOM) | SG1 (lista de materiais) |

### 6.3 Dados enviados ao Protheus (confirmação)

Ao finalizar a OP no MES, os seguintes dados são enviados ao Protheus:

| Campo | Tabela/Campo Protheus |
|---|---|
| Data/Hora real de início | SC2.C2_DATRI |
| Data/Hora real de fim | SC2.C2_DATRF |
| Quantidade produzida | SC2.C2_QTDPRO |
| Status da OP | SC2.C2_STATUS |
| Perdas (embalagem / reembalagem) | Campos customizados ou tabela auxiliar |

### 6.4 Mecanismo de integração

| Aspecto | Definição |
|---|---|
| Protocolo | REST API (HTTP/JSON) |
| Autenticação | Basic Auth ou Token Bearer (configurado via PCPA109) |
| Sincronização (entrada) | Polling periódico ou Webhook disparado pelo Protheus |
| Envio (saída) | POST ao confirmar finalização da OP |
| Tabelas Protheus consultadas | SC2, SC4, SG1, SB1, SAH |
| Plataforma opcional | TOTVS iPaaS para orquestração |

### 6.5 Regras da integração

- O MES importa apenas OPs com status **Liberada** no Protheus
- Campos originados do Protheus são **bloqueados para edição** no MES
- A confirmação ao Protheus só ocorre quando a OP atinge status **Finalizada**
- Erros de sincronização devem ser registrados em log e notificados ao perfil **PCP**
- O MES mantém cópia local dos dados da OP para operação mesmo com Protheus indisponível
- A configuração da integração (URL, credenciais) é por empresa

---

## 7. Apontamento de Produção

### 7.1 Estrutura por turno

Cada OP pode ter múltiplos turnos de apontamento. Para cada turno, o operador registra:

| Campo | Momento | Obrigatório |
|---|---|---|
| Data/Hora Inicial | Ao iniciar o turno | ✓ |
| Máquina | Ao iniciar (confirmação) | ✓ |
| Lote real | Ao iniciar | ✓ |
| Validade real | Ao iniciar | ✓ |
| Data/Hora Final | Ao finalizar o turno | ✓ |
| Quantidade produzida | Ao finalizar o turno | ✓ |
| Perda de Embalagem | Ao finalizar o turno | — |
| Perda de Reembalagem | Ao finalizar o turno | — |
| Auxiliares envolvidos | Ao finalizar o turno | — |
| Parada: hora início | Ao registrar parada | ✓ (se houve parada) |
| Parada: hora fim | Ao retomar | ✓ (se houve parada) |
| Motivo da parada | Ao registrar parada | ✓ (se houve parada) |

### 7.2 Registro de parada (status Pendente)

Quando o operador pausa a OP:

1. O sistema registra automaticamente a hora da parada
2. O operador deve selecionar o **motivo da parada** (lista configurável)
3. A OP muda para status **Pendente**
4. Se a parada exigir manutenção, o operador pode enviar uma **solicitação ao setor Manutenção**
5. Ao retomar, o sistema registra a hora de retorno e calcula o tempo de parada

### 7.3 Categorias de motivo de parada

| Categoria | Exemplos |
|---|---|
| Mecânica | Quebra de equipamento, ajuste mecânico |
| Elétrica | Falha elétrica, troca de sensor |
| Material | Falta de material, troca de lote |
| Operacional | Troca de operador, setup |
| Planejada | Manutenção preventiva, limpeza |
| Qualidade | Reprovação de amostra, retrabalho |

### 7.4 Assinaturas por turno

Cada turno registra as identificações de:
- **Operador responsável** (identificado pelo login)
- **Laboratorista** (selecionado ao finalizar)
- **Encarregado** (selecionado ao finalizar)

### 7.5 Dados calculados automaticamente

| Campo calculado | Fórmula |
|---|---|
| Tempo de produção | Hora Final − Hora Inicial − Σ Paradas |
| Tempo total de parada | Σ (Hora Fim Parada − Hora Início Parada) |
| Quantidade total da OP | Σ Quantidades por turno |
| Eficiência | (Quantidade produzida / Quantidade planejada) × 100% |
| Perda total | Perda Embalagem + Perda Reembalagem |

---

## 8. Solicitações entre Setores

### 8.1 Fluxo

```
Solicitante → seleciona setor destino → confirma dados → envia
Setor destino → inicia atendimento → executa → marca como concluído
Solicitante → aprova conclusão (ou recusa com observações)
```

### 8.2 Dados preenchidos automaticamente

Os campos abaixo são preenchidos pelo sistema com base no contexto do operador:

- Máquina vinculada à OP em execução
- Número da OP em execução
- Operador responsável (usuário logado)
- Data/hora da solicitação

### 8.3 Status da solicitação

| Status | Descrição |
|---|---|
| Aberta | Solicitação enviada, aguardando o setor destino |
| Em Atendimento | Setor destino iniciou o atendimento |
| Aguardando Aprovação | Setor destino concluiu, aguarda confirmação do solicitante |
| Concluída | Solicitante aprovou a conclusão |
| Recusada | Solicitante recusou — exige observações e reabertura |

### 8.5 Tipos de solicitação suportados

| Tipo | Setor destino |
|---|---|
| Manutenção | Setor Manutenção |
| Material / Almoxarifado | Setor Almoxarifado |
| PCP | Setor PCP |
| Qualidade | Setor Qualidade |

### 8.6 Regras de negócio

- Qualquer usuário (operador ou demais perfis) pode enviar solicitações a qualquer setor
- O setor destino pode iniciar o atendimento e registrar a execução
- Ambas as partes podem registrar observações em qualquer etapa
- A recusa exige obrigatoriamente o preenchimento do motivo

---

## 9. Design System

### 9.1 Identidade da marca Amafil

| Elemento | Valor |
|---|---|
| Logo SVG | `https://amafil.com.br/wp-content/uploads/2025/10/logo.svg` |
| Dimensões | 148 × 71 px |
| Verde primário | `#00AA4D` |
| Azul institucional | `#2B57A3` |
| Vermelho | `#EC1B23` |
| Amarelo | `#FFF366` |

### 9.2 Layout estrutural

```
┌──────────────┬────────────────────────────────────────┐
│   Sidebar    │           Content Area                  │
│  (240px)     │     (fundo cinza claro #F5F6FA)         │
│  branco      │                                         │
│  borda dir.  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  #E5E7EB     │  │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │  │
│  [Logo]      │  │ card │ │ card │ │ card │ │ card │  │
│              │  └──────┘ └──────┘ └──────┘ └──────┘  │
│  > Dashboard │                                         │
│  > Produção  │  ┌──────────────┐ ┌────────────────┐   │
│  > OPs       │  │  Chart / Grid│ │  Chart / List  │   │
│  > Paradas   │  └──────────────┘ └────────────────┘   │
│  > Solicit.  │                                         │
│  > Config    │                                         │
└──────────────┴────────────────────────────────────────┘
```

- Sidebar fixa: ~240px, fundo `#FFFFFF`, borda direita `1px solid #E5E7EB`
- Item ativo: fundo `#EFF6FF`, texto/ícone `#2563EB`, border-radius 8px
- Item inativo: texto `#6B7280`; hover: fundo `#F5F6FA`
- Content area: fundo `#F5F6FA`, cards brancos `#FFFFFF` com sombra suave
- Border-radius dos cards: 12px

### 9.3 Paleta de cores do sistema

#### Estrutura / Layout

| Nome | Hex | Uso |
|---|---|---|
| Sidebar background | `#FFFFFF` | Fundo do menu lateral |
| Sidebar border | `#E5E7EB` | Borda direita da sidebar |
| Sidebar item ativo (bg) | `#EFF6FF` | Fundo do item selecionado |
| Sidebar item ativo (texto) | `#2563EB` | Texto/ícone do item ativo |
| Sidebar item inativo | `#6B7280` | Texto/ícone dos itens normais |
| Sidebar hover | `#F5F6FA` | Fundo ao passar o mouse |
| Content background | `#F5F6FA` | Fundo da área de conteúdo |
| Card background | `#FFFFFF` | Fundo de cards e painéis |
| Texto principal | `#111827` | Títulos e valores |
| Texto secundário | `#6B7280` | Labels, subtítulos |
| Borda/divisor | `#E5E7EB` | Linhas de tabela, separadores |

#### Status semântico

| Status | Hex texto | Hex fundo | Uso |
|---|---|---|---|
| Operando / On Track | `#16A34A` | `#DCFCE7` | OP em execução, meta atingida |
| Atenção / At Risk | `#D97706` | `#FEF3C7` | Pendente, alerta moderado |
| Crítico / Parado | `#DC2626` | `#FEE2E2` | Parada não planejada, falha |
| Offline / Inativo | `#9CA3AF` | `#F3F4F6` | Máquina offline |
| Azul primário | `#2563EB` | — | Botões de ação, links |

#### Categorias de parada (gráficos)

| Categoria | Hex |
|---|---|
| Mecânica | `#EF4444` |
| Elétrica | `#F59E0B` |
| Material | `#3B82F6` |
| Operacional | `#8B5CF6` |
| Planejada | `#22C55E` |
| Qualidade | `#06B6D4` |

#### Performance por faixa (tabelas)

| Faixa | Texto | Fundo |
|---|---|---|
| ≥ 85% | `#16A34A` | `#DCFCE7` |
| 70–84% | `#D97706` | `#FEF3C7` |
| < 70% | `#DC2626` | `#FEE2E2` |

### 9.4 Tipografia

| Fonte | Uso |
|---|---|
| **Inter** | Fonte principal do sistema MES |
| **Rubik** | Fonte da marca Amafil (materiais externos) |

| Elemento | Peso | Tamanho |
|---|---|---|
| KPI valor (número grande) | 700 | 36–48px |
| Título de seção | 600 | 18–22px |
| Label de card / badge | 600 | 12–13px uppercase |
| Texto corpo / tabela | 400 | 14px |
| Subtítulo / meta | 400 | 13px, cinza |

### 9.5 Componentes principais

#### KPI Card
- Fundo branco, borda-esquerda 4px colorida por status
- Título uppercase pequeno (`#6B7280`)
- Valor grande e bold
- Badge de status (pill) no canto superior direito
- Seta de tendência ou barra de progresso abaixo do valor

#### Badge de Status
```
Formato: pill (border-radius: 9999px)
Padding: 2px 10px | Font: 12px weight 600 uppercase

Em Execução:  bg #DCFCE7, text #16A34A
Pendente:     bg #FEF3C7, text #D97706
Bloqueada:    bg #FEE2E2, text #DC2626
Finalizada:   bg #F3F4F6, text #9CA3AF
```

#### Machine Status Card
- Borda colorida conforme status (verde/vermelho/âmbar/cinza)
- Ponto indicador colorido no topo
- Código da máquina em bold
- Status em uppercase, cor do status
- Border-radius: 8px

#### Gauge OEE (Semicírculo)
- Semicírculo com trilha cinza clara e arco colorido
- Valor percentual centralizado, bold, cor do arco
- Label abaixo uppercase
- Sub-label: "Meta: XX%"

#### Tabela de Dados
- Header: uppercase, `#6B7280`, 12px, peso 500
- Separadores `#E5E7EB`
- Badge colorido por categoria/status na coluna de status
- Paginação com botão ativo `#2563EB`

#### Alert Panel
- Borda-esquerda 4px: vermelha (crítico) ou âmbar (atenção)
- Fundo tingido correspondente
- Ícone + título bold + descrição regular + timestamp à direita

### 9.6 Tokens CSS

```css
/* Estrutura */
--color-sidebar-bg:          #FFFFFF;
--color-sidebar-border:      #E5E7EB;
--color-sidebar-active-bg:   #EFF6FF;
--color-sidebar-active-text: #2563EB;
--color-sidebar-text:        #6B7280;
--color-sidebar-hover-bg:    #F5F6FA;
--color-content-bg:          #F5F6FA;
--color-card-bg:             #FFFFFF;
--color-border:              #E5E7EB;

/* Texto */
--color-text-primary:    #111827;
--color-text-secondary:  #6B7280;
--color-text-tertiary:   #9CA3AF;

/* Ações */
--color-action-primary:  #2563EB;

/* Status */
--color-success:         #16A34A;
--color-success-bg:      #DCFCE7;
--color-warning:         #D97706;
--color-warning-bg:      #FEF3C7;
--color-danger:          #DC2626;
--color-danger-bg:       #FEE2E2;
--color-offline:         #9CA3AF;
--color-offline-bg:      #F3F4F6;

/* Marca Amafil */
--color-brand-green:     #00AA4D;
--color-brand-blue:      #2B57A3;
--color-brand-red:       #EC1B23;

/* Parada por categoria */
--color-mechanical:      #EF4444;
--color-electrical:      #F59E0B;
--color-material:        #3B82F6;
--color-operator:        #8B5CF6;
--color-planned:         #22C55E;
--color-quality:         #06B6D4;
```

---

## 10. Requisitos Não-Funcionais

### 10.1 Disponibilidade e resiliência

- O MES deve operar em **modo offline** quando o Protheus estiver indisponível, armazenando apontamentos localmente e sincronizando quando a conexão for restabelecida
- Disponibilidade mínima: 99,5% em horário de produção (06h–22h)

### 10.2 Segurança

- Autenticação obrigatória para todos os usuários
- Senhas armazenadas com hash seguro (bcrypt ou Argon2)
- Master com autenticação reforçada (MFA recomendado)
- Comunicação com Protheus via HTTPS
- Credenciais de integração armazenadas criptografadas

### 10.3 Auditoria

- Toda criação, edição e exclusão de usuário é registrada em log imutável
- Toda alteração de status de OP é rastreável (quem, quando, de qual status)
- Apontamentos de produção não podem ser editados após a finalização da OP sem registro de justificativa

### 10.4 Usabilidade

- Interface responsiva: funcional em tablet e smartphone para operadores no chão de fábrica
- Apontamento de início de turno deve ser realizável em no máximo 3 toques/cliques
- Leitura de código de barras da OP por câmera do dispositivo (opcional, fase 2)

### 10.5 Performance

- Carregamento da lista de OPs em menos de 2 segundos
- Apontamento registrado em menos de 1 segundo
- Sincronização com Protheus em background, sem bloquear a interface

### 10.6 Multiempresa

- Os dados de cada empresa são completamente isolados no banco de dados
- A configuração de integração (Protheus) é independente por empresa
- O sistema suporta timezones diferentes por empresa

---

---

## 11. Ambientes por Perfil

Cada perfil acessa um ambiente distinto: tela inicial, navegação lateral, informações visíveis e ações disponíveis são personalizadas conforme o papel do usuário.

---

### 11.1 Master

**Tela inicial:** Painel multi-empresa com visão do sistema como um todo.

**Navegação disponível:**
- Empresas
- Usuários (todos os perfis, todas as empresas)
- Dashboard (visão consolidada)
- Configurações do sistema
- Logs de auditoria

**Informações visíveis:**
- Lista de empresas cadastradas e status de cada uma
- Total de usuários ativos por empresa
- Status das integrações Protheus por empresa
- Log de auditoria global (criação, edição e exclusão de usuários e empresas)

**Ações permitidas:**
- Criar, editar e desativar empresas
- Criar usuários do perfil Administração
- Acessar qualquer empresa e qualquer tela
- Visualizar logs de auditoria completos

---

### 11.2 Administração

**Tela inicial:** Dashboard gerencial da empresa com KPIs de produção consolidados.

**Navegação disponível:**
- Dashboard
- Ordens de Produção (somente visualização)
- Máquinas (somente visualização)
- Solicitações (enviar e acompanhar)
- Relatórios
- Usuários (criar e gerenciar dentro da empresa)

**Informações visíveis:**
- OEE geral da empresa (dia / semana / mês)
- Quantidade de OPs por status
- Eficiência por máquina e por turno
- Análise de paradas por categoria (gráfico)
- Ranking de perdas (embalagem e reembalagem)
- Solicitações em aberto e tempo médio de atendimento

**Ações permitidas:**
- Criar usuários de qualquer perfil dentro da empresa
- Visualizar todas as OPs e apontamentos (somente leitura)
- Enviar solicitações a qualquer setor
- Exportar relatórios

---

### 11.3 TI

**Tela inicial:** Painel de administração técnica — gestão de usuários e status da integração Protheus.

**Navegação disponível:**
- Usuários
- Integração Protheus
- Logs de integração
- Dashboard (visualização)
- Configurações da empresa

**Informações visíveis:**
- Lista de usuários da empresa (nome, perfil, último acesso, criado por)
- Status da integração com Protheus (última sincronização, erros recentes)
- Log de erros de importação/exportação de OPs
- Configurações de URL e credenciais do Protheus

**Ações permitidas:**
- Criar, editar e desativar usuários dos perfis: Manutenção, Almoxarifado, Operação, PCP e TI
- Configurar e testar a integração com Protheus
- Visualizar e exportar logs de integração
- Enviar solicitações a qualquer setor

---

### 11.4 PCP

**Tela inicial:** Painel de produção com visão geral das OPs e status das máquinas.

**Navegação disponível:**
- Dashboard de produção
- Ordens de Produção
- Máquinas
- Paradas
- Solicitações
- Relatórios

**Informações visíveis:**
- OPs por status: Importadas, Bloqueadas, Liberadas, Em Execução, Pendentes, Finalizadas
- Status em tempo real de cada máquina (Operando / Parada / Manutenção / Offline)
- OEE por máquina e geral
- Paradas em andamento e tempo de parada acumulado
- Apontamentos do turno atual por OP
- Alertas de erros de sincronização com o Protheus

**Ações permitidas:**
- Liberar e bloquear OPs
- Visualizar todos os apontamentos e turnos das OPs
- Enviar solicitações a qualquer setor
- Atender solicitações direcionadas ao PCP
- Visualizar e exportar relatórios de produção e paradas

---

### 11.5 Operação

**Tela inicial:** Lista de OPs liberadas para a máquina do operador, com botão de início de turno em destaque.

**Navegação disponível:**
- Minhas OPs
- Solicitações

**Informações visíveis:**
- OPs com status **Liberada** vinculadas à máquina do operador
- OP em execução atual (status, turno ativo, tempo decorrido)
- Solicitações enviadas pelo operador e seus status

**Ações permitidas:**
- Iniciar turno em uma OP liberada (confirmar máquina, lote e validade)
- Registrar parada (motivo obrigatório) — muda OP para Pendente
- Retomar OP pausada
- Finalizar turno (quantidade produzida, perdas, auxiliares, laboratorista, encarregado)
- Finalizar OP
- Enviar solicitações para Manutenção ou Almoxarifado a partir da OP em execução

**Restrições:**
- Só visualiza OPs da própria máquina
- Não acessa dashboards, relatórios nem gestão de usuários
- Não visualiza OPs de outros operadores ou máquinas

---

### 11.6 Manutenção

**Tela inicial:** Fila de solicitações de manutenção recebidas, ordenadas por prioridade e tempo de espera.

**Navegação disponível:**
- Solicitações (fila de atendimento)
- Histórico de paradas
- Dashboard (visualização)

**Informações visíveis:**
- Solicitações com status **Aberta** direcionadas ao setor Manutenção
- Solicitações **Em Atendimento** pelo próprio técnico
- Histórico de paradas por máquina (categoria, duração, recorrência)
- Dashboard de paradas mecânicas e elétricas (somente leitura)

**Ações permitidas:**
- Iniciar atendimento de uma solicitação (muda status para Em Atendimento)
- Registrar observações durante o atendimento
- Marcar solicitação como concluída (aguarda aprovação do solicitante)
- Enviar solicitações a outros setores
- Visualizar histórico de paradas das máquinas

---

### 11.7 Almoxarifado

**Tela inicial:** Fila de solicitações de material recebidas, ordenadas por prioridade e tempo de espera.

**Navegação disponível:**
- Solicitações (fila de atendimento)
- Histórico
- Dashboard (visualização)

**Informações visíveis:**
- Solicitações com status **Aberta** direcionadas ao setor Almoxarifado
- Solicitações **Em Atendimento** pelo próprio atendente
- Histórico de solicitações atendidas (filtros por OP, máquina, período)
- Lista de componentes (BOM) das OPs em execução (consulta para separação de material)

**Ações permitidas:**
- Iniciar atendimento de uma solicitação (muda status para Em Atendimento)
- Registrar observações durante o atendimento
- Marcar solicitação como concluída (aguarda aprovação do solicitante)
- Enviar solicitações a outros setores
- Consultar BOM das OPs em execução para separação de materiais

---

### 11.8 Resumo — Navegação por perfil

| Item de menu | Master | Admin | TI | PCP | Operação | Manut. | Almox |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard gerencial | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| Ordens de Produção | ✓ | ✓ | ✓ | ✓ | ✓ (próprias) | — | — |
| Máquinas | ✓ | ✓ | — | ✓ | — | — | — |
| Paradas | ✓ | ✓ | — | ✓ | — | ✓ | — |
| Solicitações | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mensagens | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Relatórios | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Usuários | ✓ | ✓ | ✓ | — | — | — | — |
| Integração Protheus | ✓ | — | ✓ | — | — | — | — |
| Logs de auditoria | ✓ | — | ✓ | — | — | — | — |
| Empresas | ✓ | — | — | — | — | — | — |

---

*Documento consolidado a partir de: PRD_base.md, PRD_design.md e OP.md (formulário físico Amafil)*
