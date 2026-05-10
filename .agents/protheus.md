# Skill: Integração com TOTVS Protheus

## Quando aplicar

- Implementar ou modificar jobs de sincronização com o Protheus
- Trabalhar com importação de OPs ou confirmação de apontamentos
- Configurar credenciais ou parâmetros de integração por empresa
- Tratar erros, retries ou logs de sincronização

## Contexto do projeto

O Protheus é o ERP externo (módulo SIGAPCP). O MES **importa** OPs do Protheus e **devolve** apontamentos ao finalizar.  
Referência completa: [PRD Geral — seção 6](../PRD/PRD_geral.md) | [PRD Infra — seção 12](../PRD/PRD_infra.md)

---

## Fluxo de integração

```
Protheus (SIGAPCP) → MES (importação automática) → Operador (apontamento) → Protheus (confirmação)
```

**Mecanismo:** REST API (HTTP/JSON), Basic Auth ou Token Bearer  
**Sincronização entrada:** polling a cada 5 minutos via BullMQ  
**Envio saída:** POST disparado quando OP muda para Finalizada

---

## Tabelas Protheus consultadas

| Tabela | Uso |
|---|---|
| `SC2` | Cabeçalho da OP (número, produto, datas, lote, quantidade, máquina) |
| `SC4` | Sequência de operações |
| `SG1` | Lista de materiais (BOM / componentes) |
| `SB1` | Cadastro do produto (código de barras, unidade) |
| `SAH` | Histórico de apontamentos |

### Campos críticos da SC2

| Campo Protheus | Uso no MES |
|---|---|
| `C2_NUM` | Número da OP (chave de upsert) |
| `C2_PRODUTO` | Código do produto |
| `C2_EMISSAO` | Data de emissão |
| `C2_DATPRI` | Data de fabricação / início previsto |
| `C2_DATPRF` | Data prevista de fim |
| `C2_LOTECTL` | Lote planejado |
| `C2_DTVLD` | Validade planejada |
| `C2_QTDPLAN` | Quantidade planejada |
| `C2_LINHA` | Máquina / linha |
| `C2_PRIOR` | Prioridade |
| `C2_OBS` | Observações |

### Campos enviados de volta ao Protheus

| Campo Protheus | Origem no MES |
|---|---|
| `C2_DATRI` | Data/hora real de início |
| `C2_DATRF` | Data/hora real de fim |
| `C2_QTDPRO` | Quantidade produzida (soma dos turnos) |
| `C2_STATUS` | Status final |

---

## Jobs BullMQ

| Job | Gatilho | Função |
|---|---|---|
| `sync-ops-protheus` | Polling 5 min | Importa OPs com status Liberada do Protheus |
| `confirm-op-protheus` | Evento: OP Finalizada | Envia apontamento consolidado ao Protheus |
| `retry-failed-sync` | Dead-letter automático | Retenta sincronizações com falha |
| `cleanup-logs` | Diário (pg_cron) | Remove logs de sync > 90 dias |

---

## Regras obrigatórias

1. Importar apenas OPs com status **Liberada** no Protheus
2. Upsert por `C2_NUM` — duplicatas são ignoradas silenciosamente
3. Todos os campos importados do Protheus são **read-only** no MES — nunca criar endpoint de edição para eles
4. Confirmação ao Protheus só ocorre quando OP atinge status **Finalizada**
5. Timeout de requisição: **10 segundos**
6. Em caso de falha: registrar em `integration.sync_log` + notificar perfil PCP via Realtime
7. Jobs com falha devem usar **backoff exponencial** no retry (BullMQ nativo)
8. O MES deve manter cópia local dos dados da OP — operar mesmo com Protheus indisponível
9. Credenciais de integração (URL, auth) são por empresa — nunca hardcodadas

---

## Configuração por empresa

Cada empresa cadastra:
- URL base da API Protheus
- Tipo de autenticação: Basic Auth ou Token Bearer
- Intervalo de polling (padrão: 5 min)
- Código da filial Protheus (para filtrar OPs da empresa correta)

Armazenar credenciais **criptografadas** no banco — nunca em texto plano.

---

## Schema de integração no banco

```
integration/
├── op_importadas     → OPs recebidas do Protheus (com status de sync)
└── sync_log          → Log de todas as tentativas de sync (sucesso e erro)
```

---

## Referências

- [PRD Geral — seção 6](../PRD/PRD_geral.md)
- [PRD Infra — seção 12](../PRD/PRD_infra.md)
