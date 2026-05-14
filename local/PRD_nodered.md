# PRD — Node-RED: Contagem de Sensor e Registro no PostgreSQL

**Módulo:** Node-RED (local)
**Versão:** 0.2
**Data:** 14/05/2026
**Status:** Em desenvolvimento

---

## 1. Objetivo

Registrar cada acionamento de sensor de produção como um evento no banco de dados PostgreSQL, associando o evento à máquina, ao produto e ao contador incremental. O fluxo substitui o controle por arquivo local (`contador01`) por persistência relacional, permitindo rastreabilidade e consultas futuras.

---

## 2. Contexto

| Item | Valor |
|---|---|
| Sistema | MES Amafil — Node-RED local |
| Banco | PostgreSQL 16 — `mes_db` (container `postgres:5432`) |
| Produto de referência | `243657` (variável global `produto`) |
| Tabs existentes | `mes_db` (teste/conexão), `MES T1` (lógica do sensor) |

---

## 3. Fluxo atual (implementado)

### 3.1 Tab `mes_db`
Teste de conexão com o banco. Acionado manualmente via `inject`.

```
[inject] → [postgresql: SELECT info] → [debug]
```

### 3.2 Tab `MES T1`
Contagem incremental por sensor, com persistência em arquivo local.

```
[sensor 01 (inject)]
        ↓
[file in: contador01]  ←── lê valor atual do arquivo
        ↓
[contador+1 (function)] ←── lê global / incrementa / salva global
        ↓
[file: contador01]     ←── persiste "243657=<n>" em arquivo
        ↓
[debug]

[inject "reset"] ──→ [contador+1] → [file] → [debug]
```

**Lógica da function `contador+1`:**
1. Lê `global.contador01` — se não existir, lê do `msg.payload` (arquivo)
2. Se `msg.payload === "reset"`, zera o contador
3. Caso contrário, incrementa
4. Salva em `global.contador01`
5. Emite `msg.payload = "243657=<n>"`

---

## 4. Requisitos

### 4.1 Gatilho do sensor
- Cada acionamento do sensor gera um evento
- O payload do sensor é `true` (acionamento) ou `false` (repouso)
- Apenas acionamentos `true` devem incrementar o contador e gerar registro

### 4.2 Contador incremental
- O contador é por máquina (`id_maq`)
- Persistir no banco — não apenas em arquivo ou memória global
- Deve sobreviver a reinicializações do container

### 4.3 Registro no PostgreSQL
Cada acionamento salvo na tabela `sensor_eventos` com os campos abaixo.

### 4.4 Reset do contador
- Reset manual via dashboard ou inject
- Ao resetar: registrar evento com `contador = 0` antes de zerar

---

## 5. Esquema de banco de dados

### Tabela `sensor_eventos`

```sql
CREATE TABLE sensor_eventos (
    id          SERIAL PRIMARY KEY,
    id_maq      VARCHAR(50)  NOT NULL,           -- identificador da máquina
    id_trigger  VARCHAR(100) NOT NULL,           -- identificador do sensor/trigger
    hora_entrada TIMESTAMPTZ NOT NULL,           -- momento do acionamento (borda de subida)
    hora_saida   TIMESTAMPTZ,                    -- momento do desacionamento (borda de descida), NULL se ainda ativo
    contador    INTEGER      NOT NULL DEFAULT 0, -- valor do contador no momento do evento
    produto     VARCHAR(50),                     -- código do produto (ex: 243657)
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sensor_eventos_maq   ON sensor_eventos (id_maq);
CREATE INDEX idx_sensor_eventos_data  ON sensor_eventos (hora_entrada);
```

### Migração

Executar no container PostgreSQL antes de ativar o flow:

```sql
\c mes_db
-- cole o CREATE TABLE acima
```

---

## 6. Arquitetura do flow — estado alvo

### Tab `MES T1` (após evolução)

```
[sensor 01 (inject: true)]
        ↓
[switch: payload === true?]
        ↓ sim
[function: montar evento]
    ├── id_maq    ← variável de flow ou global
    ├── id_trigger← nome do inject / tópico
    ├── hora_entrada ← new Date()
    └── contador  ← global.contador01 + 1
        ↓
[postgresql: INSERT sensor_eventos]
        ↓
[function: atualizar global]
    └── global.contador01 = contador inserido
        ↓
[debug (desabilitado em produção)]

[sensor 01 (inject: false)] → [postgresql: UPDATE hora_saida WHERE id_maq = ? AND hora_saida IS NULL]

[inject "reset"] → [function: zerar contador] → [postgresql: INSERT contador=0]
```

---

## 7. Variáveis de configuração

| Variável | Escopo | Valor | Descrição |
|---|---|---|---|
| `produto` | global | `243657` | Código do produto ativo |
| `id_maq` | flow | `T1-M1` (exemplo) | Identificador da máquina do turno |
| `id_trigger` | flow | `sensor_01` | Nome do sensor |
| `contador01` | global | numérico | Valor atual do contador em memória |

---

## 8. Etapas de implementação

| # | Tarefa | Status |
|---|---|---|
| 1 | Criar tabela `sensor_eventos` no `mes_db` | ✅ Concluído |
| 2 | Adicionar nodes `postgresql` (INSERT e UPDATE) na tab `MES T1` | ✅ Concluído |
| 3 | Substituir persistência em arquivo por contexto global + banco | ✅ Concluído |
| 4 | Tratar borda de descida do sensor (`false` → UPDATE `hora_saida`) | ✅ Concluído |
| 5 | Adicionar `switch` para rotear borda de subida e descida | ✅ Concluído |
| 6 | Adicionar tratamento de erro (`catch` node por tab) | ✅ Concluído |
| 7 | Desabilitar nodes `debug` para produção | ✅ Concluído |
| 8 | Remover senha hardcoded do config node (`postgreSQLConfig`) | Pendente |

---

## 9. Boas práticas obrigatórias

- SQL sempre parametrizado com `$1, $2…` via `msg.params` — nunca concatenar strings
- Senha do PostgreSQL via variável de ambiente do container, não hardcoded no flow JSON
- Nodes `debug` conectados mas desabilitados em produção
- Exportar o flow (≡ → Export → Download) e sobrescrever `flow01.json` após cada alteração funcional
- Commitar com `feat(nodered): <descrição>`

---

## 10. Dependências

| Pacote | Versão | Finalidade |
|---|---|---|
| `node-red-contrib-postgresql` | 0.15.4 | Query no PostgreSQL |
| `node-red-dashboard` | 3.6.6 | Interface de reset e monitoramento |
