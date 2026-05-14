# Skill: Node-RED

## Objetivo

Guiar o desenvolvimento de flows Node-RED no projeto MES: criação de tabs, nodes, integrações com PostgreSQL, FTP e dashboard, além de padrões de versionamento e boas práticas para flows de produção.

## Quando usar

- Criar ou editar flows em `local/docker/nodered/flow*.json`
- Adicionar nodes (inject, function, switch, http, postgresql, mqtt)
- Integrar o Node-RED com o banco PostgreSQL do MES
- Criar dashboards com `node-red-dashboard`
- Organizar flows por tab/fluxo de negócio

---

## Contexto do projeto

| Item | Valor |
|---|---|
| Versão Node-RED | 4.x (LTS atual: 4.1.10) |
| Storage de flows | `local/docker/nodered/flow01.json` |
| Banco de dados | PostgreSQL 16 via `node-red-contrib-postgresql` |
| Host do banco (Docker) | `postgres:5432` / banco `mes_db` |
| Dashboard | `node-red-dashboard` (ui_tab, ui_group, ui_button…) |
| FTP ativo | `node-red-contrib-ftp` apontando para `10.0.0.35:7021` |
| Tabs existentes | `mes_db`, `MES T1` |

---

## Conceitos fundamentais

### Nodes
Blocos funcionais conectados por fios (wires). Cada node recebe, transforma e/ou emite mensagens (`msg`).

### Messages (`msg`)
Objetos JavaScript trafegados entre nodes. Propriedade padrão: `msg.payload`. Evite poluir `msg` com dados desnecessários — use apenas `msg.payload`, `msg.topic` e propriedades específicas do domínio (ex: `msg.op`, `msg.apontamento`).

### Context
Estado persistido entre execuções:
- `node.context()` — escopo do node
- `flow.context()` — escopo da tab/flow
- `global.context()` — escopo global da instância

Use `flow.context()` para cache de configurações e `global.context()` para dados compartilhados entre tabs (ex: estado de OPs abertas).

### Flows (tabs)
Cada tab é um flow independente. Organize por domínio de negócio:

| Tab | Finalidade |
|---|---|
| `mes_db` | Operações de leitura/escrita no banco MES |
| `MES T1` | Lógica de negócio do turno 1 |
| `<nova tab>` | Nomear como `mes_<domínio>` (ex: `mes_apontamento`) |

---

## Nodes nativos essenciais

| Node | Uso típico no MES |
|---|---|
| `inject` | Disparar flows periodicamente (polling de OPs, sync) |
| `function` | Transformar dados, montar queries SQL, lógica de negócio |
| `switch` | Rotear por status da OP, turno, perfil |
| `change` | Mapear campos entre sistemas (ex: Protheus → MES) |
| `template` | Montar queries SQL parametrizadas com Mustache |
| `http in/out` | Criar endpoints REST internos |
| `http request` | Chamar API do backend Fastify ou Protheus |
| `debug` | Inspecionar `msg` — **desabilitar em produção** |
| `delay` | Rate limiting de requisições externas |
| `split/join` | Processar arrays de OPs ou apontamentos em lote |
| `link in/out` | Reutilizar sub-flows entre tabs sem duplicar wires |

---

## Nodes contrib instalados / recomendados

| Pacote | Função |
|---|---|
| `node-red-contrib-postgresql` | Query SQL no PostgreSQL |
| `node-red-dashboard` | UI (ui_tab, ui_group, ui_button, ui_text, ui_chart) |
| `node-red-contrib-ftp` | Integração FTP (Coamo) |
| `node-red-node-email` | Envio de alertas por e-mail |
| `node-red-contrib-mqtt-broker` | Broker MQTT embutido (leitores Hikrobot) |

---

## Integração PostgreSQL

### Config node (reutilizável entre tabs)

```json
{
  "type": "postgreSQLConfig",
  "host": "postgres",
  "port": 5432,
  "database": "mes_db",
  "user": "mes",
  "password": "{{POSTGRES_PASSWORD}}"
}
```

> Nunca hardcode a senha — use variáveis de ambiente do container ou o campo `password` referenciado por env.

### Padrão de query com parâmetros

```javascript
// node function — montar msg para postgresql node
msg.payload = "SELECT * FROM apontamentos WHERE op_id = $1 AND turno = $2";
msg.params = [msg.op_id, msg.turno];
return msg;
```

O node `postgresql` recebe `msg.payload` (SQL) e `msg.params` (array de valores).

---

## Boas práticas de flow

### Nomenclatura
- Tab: `mes_<domínio>` (ex: `mes_sync_protheus`)
- Node function: verbo + objeto (ex: `filtrar OPs abertas`, `montar payload Protheus`)
- Grupos: agrupar nodes relacionados com comentário descritivo

### Organização visual
- Fluxo da esquerda para a direita
- Separar lógica de transformação (functions) de I/O (http, postgresql, mqtt)
- Usar `link in/out` para sub-flows reutilizáveis (ex: "validar OP")
- Um `debug` desabilitado ao final de cada branch para diagnóstico rápido

### Tratamento de erros
- Sempre conectar a saída de erro dos nodes críticos (postgresql, http request)
- Usar `catch` node por tab para capturar exceções não tratadas
- Logar erros com `node.error(msg.error, msg)` dentro de functions

### Versionamento
- Flows ficam em `local/docker/nodered/flow01.json`
- Após alterações relevantes, exportar o flow pela UI (≡ → Export → Clipboard) e sobrescrever o arquivo
- Commitar com mensagem descritiva: `feat(nodered): <o que mudou>`
- Não commitar senhas — usar variáveis de ambiente e substituir por `{{PLACEHOLDER}}` antes do commit

---

## Docker — ambiente local

O Node-RED roda via Docker Compose. Exemplo de serviço:

```yaml
nodered:
  image: nodered/node-red:4-minimal
  ports:
    - "1880:1880"
  volumes:
    - ./nodered:/data
  environment:
    - TZ=America/Sao_Paulo
    - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
  networks:
    - mes_net
  depends_on:
    - postgres
```

Acesso local: `http://localhost:1880`

---

## Workflow padrão

1. Abrir o editor em `http://localhost:1880`
2. Identificar a tab de negócio correta (ou criar nova seguindo nomenclatura)
3. Construir o flow com nodes nativos + contrib
4. Testar com `inject` + `debug`
5. Desabilitar todos os `debug` não essenciais
6. Exportar o flow (≡ → Export → Download) e substituir `flow01.json`
7. Commitar apenas quando funcional e testado

---

## Anti-patterns a evitar

| Anti-pattern | Alternativa |
|---|---|
| Lógica de negócio em `template` SQL | Usar `function` para montar `msg.params`, SQL fixo no template |
| Senhas hardcoded no flow JSON | Variáveis de ambiente do container |
| Flows monolíticos com 50+ nodes em série | Dividir em sub-flows com `link in/out` |
| `debug` habilitado em produção | Desabilitar — deixar conectado mas desativado |
| Queries sem parâmetros (SQL injection) | Sempre usar `$1, $2…` com `msg.params` |
