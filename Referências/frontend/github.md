# Instruções de Publicação no GitHub - BLU (Acehub-blu)

**Última Atualização**: 2026-03-09  
**Status**: Ativo  
**Repositórios**: BLU_all (projeto completo) e BLU_Frontend (apenas pasta frontend)

Este documento descreve como publicar o projeto **Acehub-blu** no GitHub em dois repositórios: **BLU_all** (projeto completo) e **BLU_Frontend** (apenas o conteúdo da pasta `frontend/`).

**Skill do agente:** O fluxo de publicação está disponível como skill do projeto **blu-github-publish** (`.cursor/skills/blu-github-publish/SKILL.md`). Use-a quando pedir ao agente para publicar no GitHub, fazer push para BLU_all ou BLU_Frontend, ou fazer deploy do frontend.

## 📍 Informações dos Repositórios

### BLU_all (projeto completo)
- **Repositório**: https://github.com/iaacehub-afk/BLU_all.git
- **Branch Principal**: `main`
- **Pasta Local**: raiz do repositório Acehub-blu (contém `frontend/`, `scripts/`, etc.)
- **Publicação**: `git push blu-all main` (após configurar o remote `blu-all`)

### BLU_Frontend (apenas frontend)
- **Repositório**: https://github.com/iaacehub-afk/BLU_Frontend
- **Branch Principal**: `main`
- **Pasta Local** (origem dos arquivos): `frontend/` dentro de Acehub-blu
- **Publicação**: script `./scripts/deploy-frontend-to-github.sh` executado da **raiz** do repositório

### Caminho da raiz do repositório (Acehub-blu)
```
/Users/marcoscheffen/Library/CloudStorage/OneDrive-Pessoal/01 - ACEHUB - Software/01-Projetos-IDE/Acehub-blu
```

### Credenciais
- **Nunca** commite tokens ou senhas no repositório. Use GitHub CLI (`gh auth login`), Git Credential Manager ou SSH. Ao clonar ou fazer push, o Git solicitará autenticação quando necessário.

## 🚀 Comandos Rápidos (Copiar e Colar)

Raiz do repositório (use nos comandos abaixo):
```bash
cd "/Users/marcoscheffen/Library/CloudStorage/OneDrive-Pessoal/01 - ACEHUB - Software/01-Projetos-IDE/Acehub-blu"
```

### BLU_all — Configurar remote e publicar projeto completo

```bash
cd "/Users/marcoscheffen/Library/CloudStorage/OneDrive-Pessoal/01 - ACEHUB - Software/01-Projetos-IDE/Acehub-blu"

# Adicionar remote (apenas uma vez, se ainda não existir)
git remote add blu-all https://github.com/iaacehub-afk/BLU_all.git

# Verificar remotes
git remote -v

# Verificar status
git status

# Commit e push para BLU_all
git add .
git commit -m "feat: descrição das alterações"
git push blu-all main
```

### BLU_Frontend — Publicar apenas a pasta frontend (script)

```bash
cd "/Users/marcoscheffen/Library/CloudStorage/OneDrive-Pessoal/01 - ACEHUB - Software/01-Projetos-IDE/Acehub-blu"

# Simular (não faz push)
./scripts/deploy-frontend-to-github.sh --dry-run

# Publicar de fato (clone temporário + rsync + commit + push)
./scripts/deploy-frontend-to-github.sh

# Com mensagem de commit customizada
./scripts/deploy-frontend-to-github.sh --message "feat: descrição das alterações"
```

### Atualização com Merge (Se houver conflitos no BLU_all)

```bash
cd "/Users/marcoscheffen/Library/CloudStorage/OneDrive-Pessoal/01 - ACEHUB - Software/01-Projetos-IDE/Acehub-blu"

# Buscar alterações do remoto
git fetch blu-all

# Fazer merge permitindo histórias não relacionadas
git pull blu-all main --allow-unrelated-histories --no-rebase

# Se houver conflitos, resolvê-los manualmente e depois:
git add .
git commit -m "Merge: resolvido conflitos"
git push blu-all main
```

## 📝 Workflow Recomendado para Este Projeto

### 1. Antes de Começar a Trabalhar

```bash
# Navegar para a pasta do projeto
cd "/Users/marcoscheffen/Library/CloudStorage/OneDrive-Pessoal/01 - ACEHUB - Software/01-Projetos-IDE/Acehub-blu"

# Verificar se há alterações no remoto (BLU_all)
git fetch blu-all

# Atualizar código local se necessário
git pull blu-all main
```

### 2. Durante o Desenvolvimento

```bash
# Verificar status periodicamente
git status

# Adicionar arquivos específicos (recomendado)
git add arquivo1.tsx arquivo2.tsx

# Ou adicionar todos os arquivos modificados
git add .
```

### 3. Antes de Fazer Commit

```bash
# Verificar o que será commitado
git status

# Verificar diferenças
git diff

# Verificar se há arquivos que não devem ser commitados
# (verificar .gitignore)
```

### 4. Fazer Commit e Push

```bash
# Fazer commit com mensagem descritiva
git commit -m "feat: adiciona nova funcionalidade X"
# ou
git commit -m "fix: corrige bug na autenticação"
# ou
git commit -m "docs: atualiza documentação"

# Fazer push para BLU_all (projeto completo)
git push blu-all main
```

**Nota:** Para publicar apenas o frontend no BLU_Frontend, use o script `./scripts/deploy-frontend-to-github.sh` na raiz do repositório.

### 5. Se Houver Erro no Push

```bash
# Se o erro for "Updates were rejected"
git pull blu-all main --allow-unrelated-histories --no-rebase

# Resolver conflitos se houver
# Depois:
git add .
git commit -m "Merge: resolvido conflitos"
git push blu-all main
```

## 📋 Pré-requisitos

1. **Conta no GitHub** criada e verificada
2. **Git instalado** no sistema
3. **Token de acesso pessoal (PAT)** do GitHub com permissões adequadas
4. **Repositório criado** no GitHub (ou URL do repositório existente)

## 🔑 Obtenção do Token de Acesso (GitHub PAT)

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Configure:
   - **Note**: Nome descritivo (ex: "BLU Acehub-blu")
   - **Expiration**: Escolha o período de validade
   - **Scopes**: Marque pelo menos:
     - ✅ `repo` (acesso completo aos repositórios)
4. Clique em **"Generate token"**
5. **Copie o token imediatamente** (não será exibido novamente)

## 🚀 Publicação Inicial

### 1. Verificar Status do Repositório

```bash
cd "/Users/marcoscheffen/Library/CloudStorage/OneDrive-Pessoal/01 - ACEHUB - Software/01-Projetos-IDE/Acehub-blu"
git status
```

### 2. Verificar Remote Configurado

```bash
git remote -v
```

### 3. Configurar Remote (se necessário)

Para publicar o **projeto completo** no BLU_all, adicione o remote `blu-all`:

```bash
cd "/Users/marcoscheffen/Library/CloudStorage/OneDrive-Pessoal/01 - ACEHUB - Software/01-Projetos-IDE/Acehub-blu"

git remote add blu-all https://github.com/iaacehub-afk/BLU_all.git
```

**Verificar se foi configurado corretamente:**
```bash
git remote -v
```

**Resultado esperado** (entre outros remotes): `blu-all` apontando para `https://github.com/iaacehub-afk/BLU_all.git`.

**Para publicar apenas o frontend** no BLU_Frontend, use o script `./scripts/deploy-frontend-to-github.sh` (não é necessário configurar remote no repo local).

### 4. Verificar Branch Atual

```bash
git branch
```

### 5. Fazer Push Inicial

```bash
git push -u blu-all main
```

## 🔄 Atualização do Repositório

### Cenário 1: Repositório Local e Remoto Sincronizados

```bash
# Verificar status
git status

# Se houver alterações locais
git add .
git commit -m "Descrição das alterações"
git push blu-all main
```

### Cenário 2: Repositório Remoto Tem Alterações

Se o repositório remoto contém alterações que você não tem localmente:

```bash
# 1. Buscar alterações do remoto
git fetch blu-all

# 2. Fazer merge das alterações
git pull blu-all main --no-rebase --allow-unrelated-histories

# 3. Se houver conflitos, resolvê-los e depois:
git add .
git commit -m "Merge: resolvido conflitos"
git push blu-all main
```

### Cenário 3: Histórias Não Relacionadas

Quando o repositório local e remoto têm histórias completamente diferentes:

```bash
# Fazer pull permitindo histórias não relacionadas
git pull blu-all main --allow-unrelated-histories --no-rebase

# Resolver conflitos se houver
# Depois fazer commit e push
git add .
git commit -m "Merge: unificando histórias"
git push blu-all main
```

## 🔧 Resolução de Conflitos

### 1. Identificar Arquivos em Conflito

```bash
git status
```

### 2. Abrir Arquivo com Conflito

Os conflitos aparecem assim:
```
<<<<<<< HEAD
Conteúdo local
=======
Conteúdo remoto
>>>>>>> commit_hash
```

### 3. Resolver o Conflito

- **Manter conteúdo local**: Remova os marcadores e mantenha apenas o conteúdo local
- **Manter conteúdo remoto**: Remova os marcadores e mantenha apenas o conteúdo remoto
- **Combinar ambos**: Edite manualmente para combinar as duas versões

### 4. Finalizar Resolução

```bash
# Adicionar arquivo resolvido
git add nome_do_arquivo.md

# Fazer commit do merge
git commit -m "Resolvido conflito em nome_do_arquivo.md"

# Fazer push
git push blu-all main
```

## 📝 Comandos Úteis

### Verificar Log de Commits

```bash
git log --oneline
```

### Ver Diferenças Entre Local e Remoto

```bash
git fetch blu-all
git diff main blu-all/main
```

### Desfazer Último Commit (mantendo alterações)

```bash
git reset --soft HEAD~1
```

### Desfazer Último Commit (perdendo alterações)

```bash
git reset --hard HEAD~1
```

### Verificar Remote Configurado

```bash
git remote -v
```

### Adicionar Novo Remote

**Para este projeto:**
```bash
cd "/Users/marcoscheffen/Library/CloudStorage/OneDrive-Pessoal/01 - ACEHUB - Software/01-Projetos-IDE/Acehub-blu"

git remote add blu-all https://github.com/iaacehub-afk/BLU_all.git
```

**Nota**: Se o remote já existir, use `git remote set-url` em vez de `git remote add`.

### Remover Remote

```bash
git remote remove blu-all
```

## ⚠️ Boas Práticas

### 1. Sempre Verificar Status Antes de Push

```bash
git status
```

### 2. Commits Descritivos

Use mensagens de commit claras e descritivas seguindo o padrão Conventional Commits:

```bash
# ❌ Ruim
git commit -m "fix"
git commit -m "update"
git commit -m "changes"

# ✅ Bom - Padrão Conventional Commits
git commit -m "feat: adiciona página de dashboard com gráficos"
git commit -m "fix: corrige problema de autenticação no login"
git commit -m "docs: atualiza README com instruções de instalação"
git commit -m "style: ajusta espaçamento nos componentes"
git commit -m "refactor: reorganiza estrutura de pastas"
git commit -m "test: adiciona testes para componente ChatPage"
git commit -m "chore: atualiza dependências do package.json"

# Exemplos específicos para este projeto:
git commit -m "feat: adiciona integração com Supabase no ChatPage"
git commit -m "fix: corrige erro de conexão com mockSupabase"
git commit -m "feat: implementa página de seleção de empresa"
git commit -m "fix: resolve problema de navegação no Sidebar"
git commit -m "docs: adiciona instruções de publicação no GitHub"
```

### 3. Não Fazer Push Direto na Main (Recomendado)

Para projetos em equipe, use branches:

```bash
# Criar nova branch
git checkout -b feature/nova-funcionalidade

# Fazer alterações e commits
git add .
git commit -m "Adiciona nova funcionalidade"

# Fazer push da branch
git push blu-all feature/nova-funcionalidade

# Depois criar Pull Request no GitHub
```

### 4. Manter .gitignore Atualizado

Certifique-se de que arquivos sensíveis não sejam commitados:

```bash
# Verificar o que será commitado
git status

# Se necessário, adicionar ao .gitignore
echo "arquivo_sensivel.txt" >> .gitignore
```

### 5. Backup Antes de Operações Destrutivas

```bash
# Criar branch de backup
git branch backup-antes-de-merge

# Se algo der errado, voltar para o backup
git checkout backup-antes-de-merge
```

## 🔐 Segurança

### ⚠️ IMPORTANTE: Proteção do Token

1. **Nunca commite tokens no código**
2. **Use variáveis de ambiente** quando possível
3. **Revogue tokens comprometidos** imediatamente
4. **Use tokens com escopo mínimo necessário**
5. **Configure expiração** para tokens

### Remover Token do Histórico (se necessário)

Se acidentalmente commitou um token:

```bash
# Usar git-filter-repo ou BFG Repo-Cleaner
# Ou regenerar o token no GitHub
```

## 📚 Referências

- [Documentação Oficial do Git](https://git-scm.com/doc)
- [GitHub Docs - Autenticação](https://docs.github.com/en/authentication)
- [GitHub Docs - Criar Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

## 🆘 Troubleshooting

### Erro: "Updates were rejected"

**Causa**: O repositório remoto tem alterações que você não tem localmente.

**Solução**:
```bash
git pull blu-all main --allow-unrelated-histories
# Resolver conflitos se houver
git push blu-all main
```

### Erro: "Authentication failed"

**Causa**: Token inválido ou expirado.

**Solução**:
1. Verificar se o token está correto
2. Verificar se o token não expirou
3. Gerar novo token se necessário
4. Atualizar o remote com o novo token

### Erro: "Repository not found"

**Causa**: Repositório não existe ou você não tem permissão.

**Solução**:
1. Verificar se o repositório existe no GitHub
2. Verificar se o nome do repositório está correto
3. Verificar permissões do token

### Erro: "Refusing to merge unrelated histories"

**Causa**: Histórias do Git não relacionadas.

**Solução**:
```bash
git pull blu-all main --allow-unrelated-histories
```

## ✅ Checklist de Publicação

Use esta checklist antes de fazer push:

### BLU_all (projeto completo)
- [ ] Naveguei para a raiz do repositório Acehub-blu
- [ ] Verifiquei o status com `git status`
- [ ] Verifiquei o remote com `git remote -v` (deve existir `blu-all`)
- [ ] Adicionei apenas os arquivos necessários (não arquivos sensíveis)
- [ ] Verifiquei se o `.gitignore` está atualizado
- [ ] Fiz commit com mensagem descritiva
- [ ] Fiz pull antes do push (se necessário): `git pull blu-all main`
- [ ] Resolvi conflitos (se houver)
- [ ] Fiz push com sucesso: `git push blu-all main`
- [ ] Verifiquei no GitHub (iaacehub-afk/BLU_all) se o código foi publicado

### BLU_Frontend (apenas pasta frontend)
- [ ] Estou na raiz do repositório Acehub-blu
- [ ] A pasta `frontend/` contém as alterações desejadas
- [ ] Rodei o script: `./scripts/deploy-frontend-to-github.sh` (ou `--dry-run` para simular)
- [ ] Verifiquei no GitHub (iaacehub-afk/BLU_Frontend) se o código foi publicado

### Comando de Verificação Rápida (raiz do repo)

```bash
cd "/Users/marcoscheffen/Library/CloudStorage/OneDrive-Pessoal/01 - ACEHUB - Software/01-Projetos-IDE/Acehub-blu"

echo "=== Status ===" && git status && echo -e "\n=== Remote ===" && git remote -v && echo -e "\n=== Branch ===" && git branch && echo -e "\n=== Últimos Commits ===" && git log --oneline -5
```

## 📍 Informações dos Repositórios (resumo)

### BLU_all
- **URL**: https://github.com/iaacehub-afk/BLU_all.git
- **Branch**: `main`
- **Pasta local**: raiz do repositório Acehub-blu
- **Publicação**: `git push blu-all main`

### BLU_Frontend
- **URL**: https://github.com/iaacehub-afk/BLU_Frontend
- **Branch**: `main`
- **Origem dos arquivos**: pasta `frontend/` dentro de Acehub-blu
- **Publicação**: `./scripts/deploy-frontend-to-github.sh` (na raiz do repo)

### Raiz do repositório
```
/Users/marcoscheffen/Library/CloudStorage/OneDrive-Pessoal/01 - ACEHUB - Software/01-Projetos-IDE/Acehub-blu
```

### Credenciais
- Use GitHub CLI (`gh auth login`), Git Credential Manager ou SSH. Não commite tokens no repositório.

