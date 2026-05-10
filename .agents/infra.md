# Skill: Infraestrutura — Servidor On-Premises + Docker Compose

## Quando aplicar

- Configurar ou modificar o `docker-compose.yml`
- Trabalhar com Nginx (proxy reverso, TLS, roteamento)
- Provisionar ou manter o servidor Ubuntu
- Configurar backup, logs ou monitoramento
- Tratar deploy, ambientes (dev/staging/produção)

## Contexto do projeto

Servidor físico **on-premises** na fábrica da Amafil.  
**Sem dependência de cloud** — soberania total dos dados na planta.  
Referência completa: [PRD Infra](../PRD/PRD_infra.md)

---

## Arquitetura de serviços

```
Dispositivos (tablet/PC) → HTTPS → Nginx :443
                                        │
                         ┌──────────────┴──────────────┐
                         │ /api                         │ /supabase
                    Fastify :3000              Supabase (Kong :8000)
                         │                             │
                         └──────────────┬──────────────┘
                                  PostgreSQL :5432
```

### Serviços Docker Compose

| Serviço | Porta interna | Restart |
|---|---|---|
| `db` (PostgreSQL 16) | 5432 | unless-stopped |
| `redis` | 6379 | unless-stopped |
| `kong` (Supabase API GW) | 8000, 8443 | unless-stopped |
| `auth` (GoTrue) | 9999 | unless-stopped |
| `rest` (PostgREST) | 3000 | unless-stopped |
| `realtime` | 4000 | unless-stopped |
| `storage` | 5000 | unless-stopped |
| `api` (Fastify) | **3001** | unless-stopped |
| `nginx` | 443 | unless-stopped |

**Ordem de dependências:** `db` → `redis`, `kong`, `auth`, `rest`, `realtime`, `storage` → `api` → `nginx`

> **Por que 3001?** PostgREST ocupa `:3000` internamente. Fastify usa `:3001` para evitar conflito de porta no host em ambiente de desenvolvimento.

#### Health checks obrigatórios

```yaml
db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 10s
    timeout: 5s
    retries: 5

redis:
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5

api:
  depends_on:
    db:
      condition: service_healthy
    redis:
      condition: service_healthy
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"]
    interval: 15s
    timeout: 5s
    retries: 3
```

#### Persistência do Redis (obrigatório)

Redis armazena filas BullMQ — jobs de sync com Protheus não devem ser perdidos em restart:

```yaml
redis:
  command: redis-server --appendonly yes --appendfsync everysec
  volumes:
    - redis-data:/data
```

---

## Roteamento Nginx

| Path | Destino |
|---|---|
| `/api/*` | Fastify `:3001` |
| `/auth/*` | GoTrue `:9999` |
| `/realtime/*` | Supabase Realtime `:4000` (WebSocket — requer Upgrade) |
| `/storage/*` | Supabase Storage `:5000` |
| `/rest/*` | PostgREST `:3000` (CRUD automático para dashboards/listas) |
| `/*` | Next.js SPA (arquivos estáticos) |

---

## TLS na rede interna

- CA interna criada no provisionamento do servidor
- Certificado para `mes.amafil.local`
- Instalado nos dispositivos via MDM ou manualmente
- Protocolo mínimo: TLS 1.2 | Preferido: TLS 1.3
- Nenhuma porta exposta para internet

### Headers de segurança obrigatórios (Nginx)

```nginx
add_header Strict-Transport-Security "max-age=31536000" always;
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options SAMEORIGIN;
add_header Referrer-Policy no-referrer-when-downgrade;
```

---

## Limites de recursos (docker-compose)

| Serviço | CPU | Memória |
|---|---|---|
| db | 2 CPUs | 4 GB |
| api (Fastify) | 1 CPU | 1 GB |
| redis | 0.5 CPU | 512 MB |
| kong + auth + rest | 1 CPU | 1 GB |
| realtime | 0.5 CPU | 512 MB |
| nginx | 0.5 CPU | 256 MB |

---

## Volumes persistentes

| Volume | Conteúdo |
|---|---|
| `db-data` | Dados do PostgreSQL |
| `redis-data` | Dados do Redis (filas BullMQ) |
| `storage-data` | Arquivos do Supabase Storage |
| `nginx-certs` | Certificados TLS |

---

## Hardware mínimo do servidor

| Componente | Mínimo | Recomendado |
|---|---|---|
| CPU | 4 cores x86_64 | 8 cores |
| RAM | 8 GB | 16 GB |
| Disco SO | 50 GB SSD | 100 GB SSD |
| Disco dados | 200 GB SSD | 500 GB SSD |
| Rede | 1 Gbps | 1 Gbps |

**SO:** Ubuntu Server 24.04 LTS  
**Atualizações:** automáticas apenas para patches de segurança (`unattended-upgrades`)

---

## Backup PostgreSQL

```bash
# Diário às 02h via cron
pg_dump -Fc -h localhost -U postgres mes_db > backup_$(date +%Y%m%d).dump
```

| Item | Definição |
|---|---|
| Frequência | Diário às 02h |
| Retenção local | 7 dias |
| Retenção remota | 30 dias (HD ou NAS) |
| Formato | `.dump` comprimido |
| Teste de restore | Mensal |

---

## Ambientes

| Ambiente | Banco | Protheus |
|---|---|---|
| Desenvolvimento | PostgreSQL local (Docker) | Mock ou Protheus de homologação |
| Staging | `mes_staging` | Protheus de homologação |
| Produção | `mes_prod` | Protheus de produção |

Variáveis: `.env.development`, `.env.staging`, `.env.production` (produção fora do git).

### Processo de deploy em produção

```
1. PR → revisão de código
2. Merge main → deploy automático em staging
3. QA valida em staging
4. Tag de release → deploy manual em produção
5. docker compose pull && docker compose up -d
```

---

## Regras obrigatórias

1. **PostgreSQL e Redis** não ficam expostos fora dos containers
2. **Supabase Studio** desabilitado em produção (`studio` container removido ou sem binding externo)
3. Todos os serviços com `restart: unless-stopped`
4. Arquivo `.env` fora do git, permissão `600` no servidor
5. Nunca expor porta do MES para internet — apenas rede interna fabril
6. SSH acessível apenas de IPs de administração (regra de firewall)
7. Monitoramento de fase 2: Prometheus + Grafana + Uptime Kuma

---

## Referências

- [PRD Infra](../PRD/PRD_infra.md)
- [Fluxo Geral](../Fluxo_geral.md)
