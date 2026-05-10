# Skill: Banco de Dados — Supabase Self-Hosted + PostgreSQL

## Quando aplicar

- Criar ou alterar migrations do banco de dados
- Implementar ou ajustar RLS (Row Level Security)
- Trabalhar com Drizzle ORM (schema, queries, migrations)
- Configurar ou ajustar o Supabase self-hosted
- Implementar subscriptions Realtime

## Contexto do projeto

Supabase rodando **on-premises** em Docker Compose — sem dependência de cloud.  
O PostgreSQL 16 é o banco principal; RLS garante isolamento multi-tenant por `empresa_id`.  
Referência completa: [PRD Infra — seções 4 e 7](../PRD/PRD_infra.md)

---

## O que é usado do Supabase

| Recurso | Uso |
|---|---|
| PostgreSQL | Banco principal — toda lógica aqui |
| GoTrue | Emissão e validação de JWT, refresh tokens |
| Realtime | Subscriptions para status de OPs e máquinas em tempo real |
| Storage | Logos de empresa, arquivos de solicitações |
| PostgREST | CRUD simples (listas, dashboards) |

**Não usar:** Edge Functions (lógica fica no Fastify), Logflare, imgproxy.

---

## Estrutura de schemas

```
public/         → tabelas de sistema: empresas, usuários, configurações
tenant/         → dados multi-tenant com RLS: OPs, apontamentos, máquinas, solicitações
audit/          → log imutável de alterações (append-only, sem UPDATE/DELETE)
integration/    → fila e log de sincronização com Protheus
```

---

## RLS — Regra obrigatória de isolamento

Todo schema `tenant/` usa RLS. **Padrão obrigatório:**

```sql
ALTER TABLE tenant.<tabela> ENABLE ROW LEVEL SECURITY;

CREATE POLICY empresa_isolation ON tenant.<tabela>
  USING (empresa_id = current_setting('app.empresa_id')::uuid);
```

O middleware Fastify define `app.empresa_id` em cada requisição autenticada:
```
Request → JWT → extrai empresa_id → SET app.empresa_id → Route handler
```

Nunca confiar apenas no filtro da aplicação — o isolamento **deve existir no banco**.

---

## Drizzle ORM

- Usar Drizzle como ORM principal (type-safe, SQL-first)
- Migrations gerenciadas pelo Drizzle (`drizzle-kit`)
- Nunca rodar SQL de migration manualmente em produção — sempre via script versionado

```
api/src/db/
├── schema/       → definição das tabelas por schema (public, tenant, audit, integration)
├── migrations/   → arquivos gerados pelo drizzle-kit
└── index.ts      → conexão com pool de conexões
```

---

## Extensões PostgreSQL habilitadas

| Extensão | Uso |
|---|---|
| `uuid-ossp` | UUIDs como chaves primárias |
| `pg_cron` | Jobs agendados no banco (cleanup, relatórios) |
| `pgaudit` | Auditoria nativa de queries |
| `unaccent` | Busca de texto sem acentos |

---

## Configuração PostgreSQL

| Parâmetro | Valor |
|---|---|
| Versão | 16 |
| Porta | 5432 (somente interna — não exposta) |
| Encoding | UTF-8 |
| Timezone | **UTC** — ajuste por empresa feito na aplicação ao formatar timestamps |
| Max connections | 200 |
| Shared buffers | 25% da RAM |

---

## Variáveis de ambiente críticas

```env
POSTGRES_PASSWORD=<senha-forte>
JWT_SECRET=<64 chars aleatórios>
ANON_KEY=<jwt gerado>
SERVICE_ROLE_KEY=<jwt gerado>
SUPABASE_PUBLIC_URL=https://mes.amafil.local
```

Nunca commitar essas variáveis — arquivo `.env` no `.gitignore` com permissão `600`.

---

## Imutabilidade do schema `audit/`

O log de auditoria é garantido em duas camadas — ambas obrigatórias:

1. **Revogação de privilégios** — a role da aplicação não pode alterar ou deletar registros:
   ```sql
   REVOKE UPDATE, DELETE ON ALL TABLES IN SCHEMA audit FROM app_role;
   ```

2. **Trigger append-only** — cada tabela auditada dispara um trigger `AFTER INSERT OR UPDATE OR DELETE` com `SECURITY DEFINER` que grava no `audit.log` sem que a aplicação precise de acesso direto:
   ```sql
   CREATE TRIGGER trg_audit_ordens
     AFTER INSERT OR UPDATE OR DELETE ON tenant.ordens_producao
     FOR EACH ROW EXECUTE FUNCTION audit.log_changes();
   ```

Isso garante que mesmo um bug de aplicação não consiga apagar ou alterar o histórico.

---

## Regras obrigatórias

1. **Toda tabela multi-tenant tem `empresa_id UUID NOT NULL`** e RLS habilitado
2. **Schema `audit/` é append-only** — REVOKE UPDATE/DELETE na role da aplicação + trigger SECURITY DEFINER
3. **Schema `integration/` gerencia** a fila de sync com Protheus (`op_importadas`, `sync_log`)
4. Migrations são versionadas e nunca editadas retroativamente
5. PostgreSQL não fica exposto fora dos containers Docker
6. Supabase Studio desabilitado em produção (apenas dev/staging)
7. Chaves JWT rotacionadas a cada 6 meses (procedimento documentado)

---

## Referências

- [PRD Infra — seções 4, 7](../PRD/PRD_infra.md)
- [PRD Geral — seção 2 (Multi-empresa)](../PRD/PRD_geral.md)
