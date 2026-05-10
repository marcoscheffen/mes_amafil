# PRD — Sistema MES (Manufacturing Execution System)

## 1. Objetivo

Criar um sistema MES para monitoramento e controle de processos de fabricação, suportando múltiplas empresas em uma única plataforma.

---

## 2. Estrutura Multi-empresa

- O sistema suporta múltiplas empresas cadastradas
- Cada usuário pode estar vinculado a uma ou mais empresas
- O vínculo entre usuário e empresa é gerenciado pelo Master, Administrador ou TI

---

## 3. Usuários e Permissões

### 3.1 Tipos de usuário

| Perfil | Descrição |
|---|---|
| Master | Acesso total ao sistema e a todas as empresas |
| Desenvolvedor | Acesso a todos os usuários e empresas conforme vínculo definido pelo Master |
| Administração | Criado exclusivamente pelo Master |
| TI | Pode criar usuários dos perfis: Manutenção, Almoxarifado, Operação, PCP e TI |
| PCP | Planejamento e Controle de Produção |
| Manutenção | Acesso às funções de manutenção |
| Almoxarifado | Acesso às funções de almoxarifado |
| Operação | Execução de ordens de produção |

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
- O processo de autenticação do Master deve ser criterioso e seguro
- O Master pode criar, editar e excluir usuários e empresas
- Todo usuário criado deve registrar **quem criou** e **quando**
- O registro de auditoria deve ser mantido em tabela separada no banco de dados
- O registro deve ser atualizado a cada edição ou exclusão de usuário
- Cada perfil tem acesso a diferentes funções e ambientes do sistema

---

## 4. Entidades do Sistema

### 4.1 Empresa

Entidade raiz do sistema. Cada empresa possui setores e usuários vinculados.

### 4.2 Setores

| Setor | Sigla |
|---|---|
| Planejamento e Controle de Produção | PCP |
| Manutenção | — |
| Almoxarifado | — |
| Tecnologia da Informação | TI |
| Administração | — |
| Operação | — |

### 4.3 Máquinas (Setor Operação)

| Tipo de Máquina |
|---|
| Empacotadora |
| Empacotadora + Enfardadeira |
| Ensacadeira |
| Costuradeira |
| Coladeira |

---

## 5. Ordens de Produção (OP)

### 5.1 Ciclo de vida

```
BLOQUEADA → LIBERADA → EM EXECUÇÃO → PENDENTE → FINALIZADA
```

| Status | Descrição |
|---|---|
| Bloqueada | OP criada mas não disponível para execução |
| Liberada | OP disponível para o operador iniciar |
| Em Execução | OP sendo executada em uma máquina por um operador |
| Pendente | OP pausada — requer registro de motivo |
| Finalizada | OP concluída |

### 5.2 Regras de negócio

- O **PCP** cria as ordens de produção
- O **operador** só pode iniciar OPs com status **Liberada**
- Ao iniciar uma OP, o operador deve:
  - Ser identificado no sistema
  - Indicar a máquina onde a OP será executada
- OPs no status **Pendente** exigem registro obrigatório do motivo da pendência

---

## 6. Integração com TOTVS Protheus

### 6.1 Visão geral

O TOTVS Protheus é o ERP da empresa. As Ordens de Produção são geradas pelo módulo **SIGAPCP** (Planejamento e Controle de Produção) e devem ser consumidas pelo MES automaticamente, eliminando o uso de formulários físicos.

```
Protheus (SIGAPCP)  →  MES (importação/sincronização)  →  Operador (apontamento)  →  Protheus (confirmação)
```

### 6.2 Dados recebidos do Protheus (pré-preenchidos)

Os campos abaixo são oriundos da tabela **SC2** do Protheus e importados automaticamente pelo MES. O operador não preenche esses campos.

| Campo no Protheus | Campo SC2 | Campo na OP |
|---|---|---|
| Número da OP | C2_NUM | No. da OP |
| Código do Produto | C2_PRODUTO | Produto |
| Código de Barras | — (cadastro SB1) | Cod. Barra |
| Data de Emissão | C2_EMISSAO | Emissão |
| Data de Fabricação | C2_DATPRI | Fabricação / Inicio Previsto |
| Data Prevista de Fim | C2_DATPRF | Fim Previsto |
| Lote | C2_LOTECTL | Lote |
| Validade | C2_DTVLD | Validade |
| Quantidade Planejada | C2_QTDPLAN | QTDE |
| Unidade de Medida | — (cadastro SB1) | UND |
| Máquina / Linha | C2_LINHA | Maquina |
| Prioridade | C2_PRIOR | Prioridade |
| Observações | C2_OBS | Observações |
| Operações | SC4 | Operações |
| Componentes (BOM) | SG1 | Lista de Componentes |

### 6.3 Dados preenchidos pelo operador no MES

Os campos abaixo são registrados pelo operador ao **iniciar, pausar ou finalizar** cada turno de produção:

| Campo | Momento do preenchimento |
|---|---|
| Data/Hora Inicial real | Ao iniciar a OP |
| Data/Hora Final real | Ao finalizar a OP |
| Máquina utilizada | Ao iniciar (confirmação) |
| Quantidade produzida | Ao finalizar cada turno |
| Lote real | Ao iniciar (pode diferir do planejado) |
| Validade real | Ao iniciar |
| Parada: hora início e fim | Ao registrar parada |
| Motivo da parada | Obrigatório ao pausar (status Pendente) |
| Perda de Embalagem | Ao finalizar o turno |
| Perda de Reembalagem | Ao finalizar o turno |
| Auxiliares envolvidos | Ao finalizar o turno |
| Assinaturas (Operador, Lab, Encarregado) | Ao finalizar cada turno |

### 6.4 Retorno ao Protheus (MES → Protheus)

Após a finalização da OP no MES, os dados de apontamento são enviados de volta ao Protheus para atualização da SC2:

| Campo atualizado | Campo SC2 |
|---|---|
| Data/Hora real de início | C2_DATRI |
| Data/Hora real de fim | C2_DATRF |
| Quantidade produzida | C2_QTDPRO |
| Status da OP | C2_STATUS |
| Perdas registradas | (campos customizados ou tabela auxiliar) |

### 6.5 Mecanismo de integração

| Aspecto | Definição |
|---|---|
| Protocolo | REST API (HTTP/JSON) |
| Autenticação | Basic Auth ou Token (configurado via PCPA109 no Protheus) |
| Sincronização | Polling periódico (MES consulta OPs abertas) ou Webhook disparado pelo Protheus |
| Tabelas consultadas | SC2 (OPs), SC4 (operações), SG1 (componentes/BOM), SAH (máquinas/recursos) |
| Plataforma opcional | TOTVS iPaaS para orquestração e monitoramento de mensagens |

### 6.6 Regras de negócio da integração

- O MES importa apenas OPs com status **Liberada** no Protheus
- Campos bloqueados para edição no MES: todos os dados originados do Protheus (seção 6.2)
- O envio de confirmação ao Protheus ocorre somente quando a OP atinge status **Finalizada** no MES
- Erros de sincronização devem ser registrados em log e notificados ao perfil **PCP**
- O MES deve manter cópia local dos dados da OP para operação mesmo com o Protheus indisponível

---

## 7. Solicitações entre Setores

### 7.1 Fluxo de solicitação

```
Solicitante → seleciona setor destino → confirma dados → envia
Setor destino → inicia atendimento → executa → marca como concluído
Solicitante → aprova conclusão (ou recusa com observações)
```

### 7.2 Dados preenchidos automaticamente na solicitação

Os campos abaixo são preenchidos automaticamente pelo sistema e apenas confirmados pelo usuário:

- Máquina vinculada à OP em execução
- Número da OP
- Operador responsável

### 7.3 Regras de negócio

- Qualquer usuário (operador ou demais perfis) pode enviar solicitações a qualquer setor
- O setor destino pode iniciar o atendimento e registrar a execução
- A confirmação de execução fica no status **Aguardando Aprovação de Conclusão**
- O setor solicitante aprova ou recusa a conclusão
- Ambas as partes podem registrar observações sobre a execução
