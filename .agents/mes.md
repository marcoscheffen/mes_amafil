# Skill: MES — Regras de Negócio

## Quando aplicar

- Criar ou modificar lógica de Ordens de Produção (OPs)
- Implementar apontamentos de produção, turnos, paradas
- Gerenciar perfis de usuário, permissões, hierarquia
- Implementar solicitações entre setores
- Qualquer regra de negócio do domínio de manufatura

## Contexto do projeto

Sistema MES (Manufacturing Execution System) para a **Amafil** (indústria alimentícia).  
Substitui formulários físicos de OP gerados pelo TOTVS Protheus.  
Referência completa: [PRD Geral](../PRD/PRD_geral.md)

---

## Ciclo de vida da OP

```
IMPORTADA → BLOQUEADA → LIBERADA → EM EXECUÇÃO → PENDENTE → FINALIZADA
                                        ↑_______________|
```

| Status | Responsável | Observação |
|---|---|---|
| Importada | Sistema (automático) | Recebida do Protheus, ainda não revisada |
| Bloqueada | PCP | Disponível mas não liberada para execução |
| Liberada | PCP | Operador pode iniciar |
| Em Execução | Operador | Uma máquina = uma OP por vez |
| Pendente | Operador | Pausa — motivo obrigatório |
| Finalizada | Operador/PCP | Dados enviados ao Protheus |

---

## Perfis e hierarquia de criação

```
Master (só via SQL direto)
 └── Administração (só o Master cria)
      └── TI, Manutenção, Almoxarifado, Operação, PCP
TI
 └── Manutenção, Almoxarifado, Operação, PCP, TI
```

| Funcionalidade | Master | Admin | TI | PCP | Operação | Manut. | Almox |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Criar empresas | ✓ | — | — | — | — | — | — |
| Criar usuários | ✓ | ✓ | ✓ | — | — | — | — |
| Liberar OPs | ✓ | ✓ | — | ✓ | — | — | — |
| Executar OPs | ✓ | — | — | — | ✓ | — | — |
| Atender solicitações | — | — | ✓ | ✓ | — | ✓ | ✓ |

---

## Regras obrigatórias

### OPs
1. Campos vindos do Protheus são **somente leitura** — nunca permitir edição no MES
2. Uma máquina só pode ter **uma OP Em Execução** por vez
3. Operador só pode iniciar OP com status **Liberada**
4. Pausa (status Pendente) exige seleção obrigatória do motivo da parada
5. Ao finalizar, consolidar todos os turnos antes de enviar ao Protheus

### Apontamentos por turno
- Registrar: data/hora inicial, máquina, lote real, validade real
- Ao finalizar: quantidade produzida, perdas (embalagem e reembalagem), auxiliares
- Paradas: hora início + hora fim + motivo (obrigatório)
- Assinaturas: operador (login), laboratorista, encarregado

### Cálculos automáticos
- `tempo_producao = hora_final - hora_inicial - Σ_paradas`
- `eficiencia = (qtd_produzida / qtd_planejada) × 100`
- `perda_total = perda_embalagem + perda_reembalagem`
- `qtd_total_op = Σ_qtd_por_turno`

### Apontamentos são append-only
- Não permitir edição de apontamento após finalização da OP sem justificativa registrada em log

### Multi-empresa
- Todos os dados têm `empresa_id` — o isolamento é obrigatório em banco (RLS) e não só na aplicação
- Usuário pode estar vinculado a mais de uma empresa

### Solicitações entre setores
- Qualquer perfil pode enviar solicitação a qualquer setor
- Máquina, OP e operador são preenchidos automaticamente pelo contexto
- Recusa exige preenchimento obrigatório do motivo

### Auditoria
- Todo CRUD de usuário: registrar `quem criou`, `quando`, em tabela separada imutável
- Toda transição de status de OP deve ser rastreável (quem, quando, de/para qual status)

---

## Motivos de parada (categorias)

| Categoria | Cor |
|---|---|
| Mecânica | `#EF4444` |
| Elétrica | `#F59E0B` |
| Material | `#3B82F6` |
| Operacional | `#8B5CF6` |
| Planejada | `#22C55E` |
| Qualidade | (usar cor do status crítico) |

---

## Referências

- [PRD Geral — seções 3, 4, 5, 7, 8](../PRD/PRD_geral.md)
- [Formulário físico da OP](../OP.md)
