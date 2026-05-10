# Skill: Backend API — Node.js + Fastify

## Quando aplicar

- Criar ou modificar rotas da API (endpoints)
- Implementar plugins, middlewares ou services do Fastify
- Trabalhar com autenticação JWT e controle de acesso por perfil
- Implementar jobs BullMQ (sincronização, filas)
- Adicionar validações de entrada/saída (JSON Schema / Zod)
- Qualquer lógica de negócio que viva no backend

## Contexto do projeto

API REST em **Node.js 22 LTS + Fastify 5 + TypeScript 5**.  
Porta interna: **3001** (PostgREST ocupa `:3000`).  
Toda regra de negócio e integração com Protheus passa por aqui — o Supabase é usado apenas para Auth, Realtime e Storage.  
Referência: [PRD Infra — seções 5, 10](../PRD/PRD_infra.md) | [PRD Geral — seção 3](../PRD/PRD_geral.md)

---

## Estrutura do projeto

```
api/
├── src/
│   ├── plugins/          → Fastify plugins registrados globalmente
│   │   ├── auth.ts       → JWT validation (@fastify/jwt)
│   │   ├── db.ts         → Pool de conexão Drizzle + PostgreSQL
│   │   └── redis.ts      → Cliente Redis (BullMQ + cache)
│   ├── routes/           → Endpoints por módulo (registrados no Fastify)
│   │   ├── auth/         → Login, refresh, logout
│   │   ├── ordens/       → CRUD e ciclo de vida das OPs
│   │   ├── apontamentos/ → Turnos, paradas, finalização
│   │   ├── maquinas/     → Status e gestão de máquinas
│   │   ├── solicitacoes/ → Envio e atendimento de solicitações
│   │   ├── usuarios/     → Criação e gestão de usuários por perfil
│   │   └── integracoes/  → Configuração e status da integração Protheus
│   ├── services/         → Regras de negócio (chamados pelas routes)
│   ├── jobs/             → Workers BullMQ
│   │   ├── sync-ops.ts
│   │   ├── confirm-op.ts
│   │   └── retry.ts
│   ├── middlewares/      → Hooks Fastify (tenant, perfil, validação)
│   ├── schemas/          → JSON Schemas de req/res (Fastify nativo + Zod)
│   └── db/               → Drizzle schema + migrations
│       ├── schema/
│       └── migrations/
├── tests/
├── .env
└── package.json
```

---

## Plugins Fastify registrados

| Plugin | Função |
|---|---|
| `@fastify/helmet` | Headers de segurança HTTP |
| `@fastify/cors` | CORS restrito à rede interna (`mes.amafil.local`) |
| `@fastify/jwt` | Validação e decodificação de tokens JWT |
| `@fastify/rate-limit` | Proteção contra abuso de endpoints |
| `@fastify/sensible` | Erros HTTP padronizados (`reply.notFound()`, etc.) |
| `@fastify/swagger` | Documentação automática da API (dev/staging) |

---

## Middleware de tenant (obrigatório em toda rota autenticada)

Todo request autenticado passa pelo hook `onRequest` que:
1. Valida o JWT via `@fastify/jwt`
2. Extrai `empresa_id` e `user_perfil` do payload
3. Injeta na sessão PostgreSQL via `SET LOCAL`

```typescript
// middlewares/tenant.ts
fastify.addHook('onRequest', async (request, reply) => {
  await request.jwtVerify();
  const { empresa_id, perfil } = request.user;

  // Injeta no contexto para uso nas routes
  request.empresaId = empresa_id;
  request.userPerfil = perfil;
});

// Em cada handler que acessa o banco:
await db.execute(sql`SET LOCAL app.empresa_id = ${empresaId}`);
await db.execute(sql`SET LOCAL app.user_perfil = ${perfil}`);
```

**Nunca** confiar apenas no filtro da aplicação — o RLS do banco é a última linha de defesa.

---

## Hierarquia de perfis — validação no backend

Validar no middleware antes de qualquer `INSERT` de usuário:

```typescript
const CRIACAO_PERMITIDA: Record<string, string[]> = {
  master: ['admin'],
  admin:  ['ti', 'manutencao', 'almoxarifado', 'operacao', 'pcp'],
  ti:     ['ti', 'manutencao', 'almoxarifado', 'operacao', 'pcp'],
};

function podeCriarPerfil(criador: string, alvo: string): boolean {
  return CRIACAO_PERMITIDA[criador]?.includes(alvo) ?? false;
}
```

Retornar `403 Forbidden` se o perfil do autenticado não puder criar o perfil solicitado.

---

## Criação do usuário Master (procedimento operacional)

O Master **nunca é criado pela API** — apenas via SQL direto no container `db`:

```bash
docker exec -it mes-db psql -U postgres -d mes_prod
```

```sql
INSERT INTO public.users (id, email, password_hash, perfil, created_at)
VALUES (
  gen_random_uuid(),
  'master@amafil.local',
  crypt('senha-forte-inicial', gen_salt('bf', 12)),
  'master',
  now()
);
```

- Trocar senha no primeiro acesso
- Ativar MFA TOTP no GoTrue: `MFA_ENABLED=true`, `MFA_TOTP_ENABLED=true`
- Registrar na documentação de rotação semestral de credenciais

---

## Padrão de rotas

```typescript
// routes/ordens/index.ts
export async function ordensRoutes(fastify: FastifyInstance) {
  // Listar OPs (requer autenticação + tenant)
  fastify.get('/', {
    onRequest: [fastify.authenticate, fastify.injectTenant],
    schema: { response: { 200: ListaOPsSchema } },
  }, listarOPs);

  // Liberar OP (apenas PCP)
  fastify.patch('/:id/liberar', {
    onRequest: [fastify.authenticate, fastify.injectTenant, fastify.requirePerfil(['pcp', 'admin', 'master'])],
    schema: { params: ParamsIdSchema },
  }, liberarOP);
}
```

Usar `fastify.requirePerfil([...])` como decorator para verificar o perfil antes de executar o handler.

---

## Jobs BullMQ

| Job | Arquivo | Gatilho | Timeout |
|---|---|---|---|
| `sync-ops-protheus` | `jobs/sync-ops.ts` | Polling 5 min | 10s por req Protheus |
| `confirm-op-protheus` | `jobs/confirm-op.ts` | Evento: OP Finalizada | 10s por req Protheus |
| `retry-failed-sync` | automático (dead-letter) | BullMQ nativo | — |
| `cleanup-logs` | pg_cron | Diário 02h | — |

```typescript
// jobs/sync-ops.ts
const syncQueue = new Queue('sync-ops-protheus', { connection: redis });

// Worker com retry e backoff exponencial
const worker = new Worker('sync-ops-protheus', processSyncOPs, {
  connection: redis,
  settings: {
    backoffStrategy: (attempt) => Math.pow(2, attempt) * 1000, // 1s, 2s, 4s, 8s...
  },
});
```

---

## Endpoint de health check

Obrigatório para o Docker Compose `healthcheck`:

```typescript
fastify.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
}));
```

Acessível sem autenticação — usado pelo Nginx e Docker Compose.

---

## Tratamento de erros

- Usar `@fastify/sensible` para erros semânticos: `reply.forbidden()`, `reply.notFound()`, `reply.badRequest()`
- Erros de integração Protheus: registrar em `integration.sync_log` e notificar PCP via Realtime
- Nunca expor stack trace em produção (`NODE_ENV=production`)

---

## Regras obrigatórias

1. **Toda rota que acessa dados multi-tenant** deve chamar `injectTenant` (SET LOCAL no banco)
2. **Campos vindos do Protheus** nunca têm endpoint de edição — read-only
3. **Hierarquia de perfis** sempre validada no middleware antes do handler
4. Timeout de 10s para qualquer chamada à API do Protheus
5. Jobs BullMQ com `backoff exponencial` — nunca retry imediato em falha
6. **Porta 3001** — não mudar (PostgREST ocupa :3000)
7. `.env` fora do git; variáveis sensíveis nunca no código

---

## Referências

- [PRD Infra — seção 5](../PRD/PRD_infra.md)
- [PRD Geral — seções 3, 6](../PRD/PRD_geral.md)
- [Skill: Banco de dados](./supabase.md)
- [Skill: Integração Protheus](./protheus.md)
- [Skill: Regras de negócio MES](./mes.md)
