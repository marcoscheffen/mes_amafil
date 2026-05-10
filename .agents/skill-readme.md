# Skill: Criar e Atualizar README.md

## Quando aplicar

- Criar o README.md do projeto do zero
- Atualizar o README após mudanças relevantes de arquitetura ou stack
- Revisar documentação desatualizada

## Contexto do projeto

O `README.md` atual está vazio. Ao criá-lo, documentar o essencial para um desenvolvedor que está chegando ao projeto.

---

## Estrutura obrigatória do README

```markdown
# MES — Sistema de Manufatura Amafil

## O que é
<1 parágrafo: objetivo do sistema e problema que resolve>

## Stack
<tabela: camada + tecnologia>

## Pré-requisitos
<lista: Docker, Node.js, etc.>

## Como rodar em desenvolvimento
<comandos passo a passo>

## Ambientes
<dev / staging / produção>

## Estrutura do projeto
<árvore de diretórios comentada>

## Documentação
<links para PRDs e arquivos em .agents/>
```

---

## Regras obrigatórias

1. Não incluir senhas, chaves ou variáveis de ambiente no README
2. Comandos devem ser testáveis — não incluir passos hipotéticos
3. Manter enxuto: README é ponto de entrada, não manual completo
4. Atualizar quando houver mudança de stack ou processo de deploy

---

## Referências

- [PRD Geral](../PRD/PRD_geral.md)
- [PRD Infra](../PRD/PRD_infra.md)
- [Índice de skills](.agents/README.md)
