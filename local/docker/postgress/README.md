# PostgreSQL + PgAdmin — Ambiente Local

Stack local para desenvolvimento: PostgreSQL 16 + PgAdmin 4, orquestrados via Docker Compose.

---

## Estrutura

```
postgress/
├── docker-compose.yml   # definição dos serviços
├── .env.example         # variáveis de ambiente (copiar para .env)
└── README.md
```

---

## Pré-requisitos

- Docker Desktop instalado e rodando
- Docker Compose v2

---

## Início rápido

```bash
# 1. Copiar variáveis de ambiente
cp .env.example .env

# 2. Ajustar credenciais no .env (opcional)

# 3. Subir os containers
docker compose up -d

# 4. Verificar status
docker compose ps
```

---

## Serviços

| Serviço    | Imagem              | Porta padrão | Container        |
|------------|---------------------|--------------|------------------|
| PostgreSQL | `postgres:16`       | `5432`       | `mes_postgres`   |
| PgAdmin    | `dpage/pgadmin4`    | `5050`       | `mes_pgadmin`    |

---

## Acesso

### String de conexão
```
postgresql://mes:senha@localhost:5432/mes_db
```

### PgAdmin
- URL: [http://localhost:5050](http://localhost:5050)
- Email: `admin@example.com`
- Senha: `admin`

#### Registrar o servidor no PgAdmin
1. Abrir PgAdmin → **Add New Server**
2. **General → Name:** `MES Local`
3. **Connection:**
   - Host: `postgres` (nome do container na rede Docker)
   - Port: `5432`
   - Database: `mes_db`
   - Username: `mes`
   - Password: `senha`

---

## Variáveis de ambiente

| Variável           | Padrão           | Descrição                  |
|--------------------|------------------|----------------------------|
| `POSTGRES_USER`    | `mes`            | Usuário do banco           |
| `POSTGRES_PASSWORD`| `senha`          | Senha do banco             |
| `POSTGRES_DB`      | `mes_db`         | Nome do banco              |
| `POSTGRES_PORT`    | `5432`           | Porta exposta no host      |
| `PGADMIN_EMAIL`    | `admin@example.com` | Login do PgAdmin        |
| `PGADMIN_PASSWORD` | `admin`          | Senha do PgAdmin           |
| `PGADMIN_PORT`     | `5050`           | Porta exposta no host      |

---

## Comandos úteis

```bash
# Parar sem remover volumes
docker compose stop

# Parar e remover containers (mantém dados)
docker compose down

# Remover tudo, incluindo volumes (ATENÇÃO: apaga os dados)
docker compose down -v

# Ver logs do postgres
docker compose logs -f postgres

# Acessar o banco via psql
docker exec -it mes_postgres psql -U mes -d mes_db
```

---

## Notas

- Os dados do PostgreSQL persistem no volume Docker `pgdata` — sobrevivem ao `docker compose down`.
- Para resetar o banco completamente, use `docker compose down -v`.
- O PgAdmin só sobe após o PostgreSQL estar saudável (`healthcheck`).
