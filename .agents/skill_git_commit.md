# Skill: Diretrizes de Commit no GitHub

Esta skill define as regras e o padrão a ser seguido pelo agente de IA ao realizar operações no Git e GitHub neste repositório. Sempre siga essas instruções antes de enviar novos códigos.

## 1. Regras Gerais
- Antes de qualquer commit, rode `git status` para entender o que foi modificado e evite commitar arquivos indesejados.
- Garanta que arquivos ignoráveis (como logs, pastas de dependências ou chaves `.env`) não estão sendo rastreados. Se estiverem, atualize o `.gitignore`.
- Antes de enviar (`push`), garanta que está na branch correta.

## 2. Padrão de Commits (Conventional Commits)
Use mensagens descritivas seguindo o padrão abaixo para facilitar a leitura do histórico:
- `feat:` -> Quando adicionar uma nova funcionalidade ao sistema (ex: `feat: adiciona tela de relatórios`).
- `fix:` -> Quando consertar um bug ou erro (ex: `fix: corrige o travamento na abertura da ordem de produção`).
- `docs:` -> Quando a alteração for apenas em documentação (README, PRD, skills, etc).
- `style:` -> Quando a alteração não afeta o significado do código (espaçamento, formatação, etc).
- `refactor:` -> Uma mudança de código que nem corrige um bug nem adiciona uma feature.
- `chore:` -> Atualização de tarefas de build, configuração de pacotes, etc (ex: `chore: atualiza dependências do npm`).

## 3. Workflow de Execução
Sempre que o usuário pedir para commitar o trabalho:
1. Revise as alterações feitas.
2. Agrupe as alterações lógicas (não adicione arquivos que não tenham a ver com o objetivo do commit).
3. Faça o commit com uma mensagem curta no sumário (primeira linha) usando o padrão acima.
4. Faça o `git push` para o repositório remoto: `https://github.com/marcoscheffen/mes_amafil.git`.
5. Reporte ao usuário o status do commit e os arquivos enviados.
