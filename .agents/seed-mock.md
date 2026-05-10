---
name: seed-mock
description: Gera arquivos TypeScript de dados mocados para o sistema MES da Amafil, sem necessidade de banco de dados ou conexão com Supabase. Use esta skill sempre que o usuário pedir para criar dados de teste, popular o sistema para desenvolvimento, gerar cenários de teste, criar fixtures, seed data, mockar hooks, ou quando precisar de dados realistas para testar componentes e telas sem Supabase. Acione mesmo que o usuário não use a palavra "skill" — se a intenção é gerar dados falsos/mocados/de teste para o MES, esta skill deve ser usada.
---

# Seed Mock — Dados Mocados para o MES

O objetivo desta skill é gerar dados TypeScript tipados que simulam o banco de dados do sistema MES da Amafil, permitindo desenvolvimento e testes sem conexão com Supabase.

## Estrutura de saída

Os mocks ficam em `src/mocks/` dentro do projeto frontend:

```
src/mocks/
├── index.ts          ← re-exporta tudo
├── empresas.ts
├── usuarios.ts
├── maquinas.ts
├── ordens.ts
├── turnos.ts
├── paradas.ts
└── solicitacoes.ts
```

## Antes de gerar

Sempre leia os tipos atuais para garantir compatibilidade:
- `src/types/index.ts` — interfaces de todas as entidades
- `src/lib/constants.ts` — enums e values válidos para status, perfil, categoria, etc.

Nunca invente campos ou valores que não existam nesses arquivos.

## Princípios dos dados

**Realismo contextual:** os dados devem fazer sentido para uma indústria alimentícia brasileira.
- Produtos: farinhas, fubás, misturas para bolo, temperos, sal, açúcar
- Números de OP: formato `OP-YYYYMM-NNNN` (ex: `OP-202505-0042`)
- Lotes: formato `LT-YYYYMMDD-NN` (ex: `LT-20250508-01`)
- Máquinas: ensacadeiras, misturadoras, seladora, empacotadora, balança dosadora
- Nomes de usuários: brasileiros, realistas
- CNPJs, datas e horários: plausíveis

**Cobertura de cenários:** gere pelo menos um registro para cada valor possível de cada status/enum.
- Todas as 6 situações de OP (`importada`, `bloqueada`, `liberada`, `em_execucao`, `pendente`, `finalizada`)
- Todos os 4 status de máquina (`operando`, `parada`, `manutencao`, `offline`)
- Pelo menos um usuário de cada perfil
- Paradas com categorias variadas

**Relacionamentos consistentes:** `empresa_id`, `op_id`, `maquina_id`, `operador_id` devem referenciar IDs que existem no arquivo correspondente.

## IDs

Use UUIDs fixos e legíveis. Defina-os como constantes no topo de cada arquivo para facilitar referências cruzadas:

```ts
// empresas.ts
export const EMPRESA_ID = "11111111-0000-0000-0000-000000000001";

// usuarios.ts — referencia EMPRESA_ID importado de empresas.ts
import { EMPRESA_ID } from "./empresas";
```

## Padrão de cada arquivo

```ts
import type { Entidade } from "@/types";

export const ENTIDADE_ID_1 = "uuid-fixo-aqui";

export const mockEntidades: Entidade[] = [
  {
    id: ENTIDADE_ID_1,
    // campos...
  },
];
```

## index.ts

Deve re-exportar todos os arrays e IDs constantes:

```ts
export * from "./empresas";
export * from "./usuarios";
export * from "./maquinas";
export * from "./ordens";
export * from "./turnos";
export * from "./paradas";
export * from "./solicitacoes";
```

## Cenários recomendados

Ao gerar as OPs, crie cenários que cobrem as principais telas do sistema:

| Cenário | O que gerar |
|---------|-------------|
| **Chão de fábrica ativo** | 2-3 OPs `em_execucao` com turnos abertos e paradas recentes |
| **Fila de liberação** | 3-4 OPs `liberada` em máquinas diferentes |
| **Aguardando PCP** | 2 OPs `importada` e 1 `bloqueada` |
| **Histórico** | 4-5 OPs `finalizada` com turnos completos e quantidades |
| **Manutenção** | 1-2 máquinas `manutencao` com solicitação `em_atendimento` |

## Uso dos mocks nos hooks

Quando o usuário quiser conectar os mocks aos hooks existentes, o padrão é: verificar se `NEXT_PUBLIC_DEV_BYPASS=true` e retornar os mocks em vez de chamar o Supabase. Exemplo:

```ts
// dentro de useOrdens.ts
import { mockOrdens } from "@/mocks";

if (process.env.NEXT_PUBLIC_DEV_BYPASS === "true") {
  setOrdens(mockOrdens);
  return;
}
// ... chamada real ao Supabase
```

Só modifique os hooks se o usuário pedir explicitamente.

## Quantidade sugerida por entidade

| Entidade | Mínimo | Ideal |
|----------|--------|-------|
| Empresa | 1 | 2 |
| Usuario | 1 por perfil (8) | 10-12 |
| Maquina | 4 | 6-8 |
| OrdemProducao | 1 por status (6) | 10-14 |
| Turno | 1 por OP ativa | 6-8 |
| Parada | 1 por categoria (6) | 8-10 |
| Solicitacao | 1 por status (5) | 6-8 |
