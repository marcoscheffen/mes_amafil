# Skill: Design System — MES Amafil

## Quando aplicar

- Criar ou modificar componentes de UI
- Definir cores, tokens CSS ou tipografia
- Implementar badges, cards, tabelas, gráficos
- Garantir consistência visual entre telas

## Contexto do projeto

Design baseado na identidade da marca **Amafil** + sistema de status semântico industrial.  
Stack UI: Next.js 15 + shadcn/ui + Tailwind CSS + Inter (fonte principal).  
Referência completa: [PRD Geral — seção 9](../PRD/PRD_geral.md)

---

## Identidade Amafil

| Elemento | Valor |
|---|---|
| Logo SVG | `https://amafil.com.br/wp-content/uploads/2025/10/logo.svg` |
| Dimensões | 148 × 71 px |
| Verde primário | `#00AA4D` |
| Azul institucional | `#2B57A3` |
| Vermelho | `#EC1B23` |
| Amarelo | `#FFF366` |

---

## Layout estrutural

```
┌──────────────┬────────────────────────────────┐
│  Sidebar     │         Content Area            │
│  240px       │         fundo #F5F6FA           │
│  #1A1D2E     │                                 │
│  [Logo]      │  KPI  KPI  KPI  KPI             │
│  > Dashboard │                                 │
│  > OPs       │  Chart/Grid   Chart/List        │
│  > Paradas   │                                 │
│  > Solicit.  │                                 │
│  > Config    │                                 │
└──────────────┴────────────────────────────────┘
```

- Sidebar: fundo `#1A1D2E`, item ativo `#2563EB`
- Content: fundo `#F5F6FA`, cards brancos `#FFFFFF` com sombra suave
- Border-radius cards: 12px

---

## Tokens CSS obrigatórios

```css
/* Estrutura */
--color-sidebar-bg:      #1A1D2E;
--color-content-bg:      #F5F6FA;
--color-card-bg:         #FFFFFF;
--color-border:          #E5E7EB;

/* Texto */
--color-text-primary:    #111827;
--color-text-secondary:  #6B7280;

/* Ações */
--color-action-primary:  #2563EB;

/* Status semântico */
--color-success:         #16A34A;
--color-success-bg:      #DCFCE7;
--color-warning:         #D97706;
--color-warning-bg:      #FEF3C7;
--color-danger:          #DC2626;
--color-danger-bg:       #FEE2E2;
--color-offline:         #9CA3AF;
--color-offline-bg:      #F3F4F6;

/* Marca Amafil */
--color-brand-green:     #00AA4D;
--color-brand-blue:      #2B57A3;
--color-brand-red:       #EC1B23;

/* Categorias de parada (gráficos) */
--color-mechanical:      #EF4444;
--color-electrical:      #F59E0B;
--color-material:        #3B82F6;
--color-operator:        #8B5CF6;
--color-planned:         #22C55E;
```

---

## Status semântico

| Status | Texto | Fundo | Uso |
|---|---|---|---|
| Operando / Em Execução | `#16A34A` | `#DCFCE7` | OP em execução, meta atingida |
| Pendente / Atenção | `#D97706` | `#FEF3C7` | OP pausada, alerta moderado |
| Bloqueada / Crítico | `#DC2626` | `#FEE2E2` | Parada não planejada, erro |
| Offline / Inativo | `#9CA3AF` | `#F3F4F6` | Máquina offline, OP finalizada |

### Faixas de performance (eficiência)

| Faixa | Texto | Fundo |
|---|---|---|
| ≥ 85% | `#16A34A` | `#DCFCE7` |
| 70–84% | `#D97706` | `#FEF3C7` |
| < 70% | `#DC2626` | `#FEE2E2` |

---

## Tipografia

**Fonte principal:** Inter  
**Fonte de marca (materiais externos):** Rubik

| Elemento | Peso | Tamanho |
|---|---|---|
| KPI valor | 700 | 36–48px |
| Título de seção | 600 | 18–22px |
| Label / badge | 600 | 12–13px uppercase |
| Texto corpo / tabela | 400 | 14px |
| Subtítulo / meta | 400 | 13px, cinza |

---

## Componentes principais

### Badge de Status (pill)
```
border-radius: 9999px | padding: 2px 10px | font: 12px weight 600 uppercase

Em Execução:  bg #DCFCE7, text #16A34A
Pendente:     bg #FEF3C7, text #D97706
Bloqueada:    bg #FEE2E2, text #DC2626
Finalizada:   bg #F3F4F6, text #9CA3AF
```

### KPI Card
- Fundo branco, borda-esquerda 4px colorida por status
- Título uppercase pequeno (`#6B7280`)
- Valor grande e bold (36–48px)
- Badge de status no canto superior direito
- Seta de tendência ou barra de progresso abaixo do valor

### Machine Status Card
- Borda colorida conforme status (verde/vermelho/âmbar/cinza)
- Ponto indicador colorido no topo
- Código da máquina em bold
- Status em uppercase com cor do status
- border-radius: 8px

### Gauge OEE (semicírculo)
- Semicírculo com trilha cinza e arco colorido
- Valor percentual centralizado, bold, cor do arco
- Label abaixo uppercase + sub-label "Meta: XX%"

### Tabela de Dados
- Header: uppercase, `#6B7280`, 12px, peso 500
- Separadores `#E5E7EB`
- Badge colorido por status na coluna de status
- Paginação com botão ativo `#2563EB`

### Alert Panel
- Borda-esquerda 4px: vermelha (crítico) ou âmbar (atenção)
- Fundo tingido correspondente
- Ícone + título bold + descrição regular + timestamp à direita

---

## Responsividade

- Design mobile-first: otimizado para tablet 10" (1280×800)
- Funcional em smartphone e desktop
- Sem app nativo — PWA instalável

---

## Regras obrigatórias

1. Sempre usar tokens CSS (`--color-*`) — nunca hardcodar hex diretamente no componente
2. Badges de status sempre no formato pill com as cores do status semântico
3. Font-family principal: `Inter` para toda interface do MES
4. Cards com `border-radius: 12px` e fundo `#FFFFFF`
5. Sidebar sempre `#1A1D2E` com item ativo `#2563EB`

---

## Referências

- [PRD Geral — seção 9](../PRD/PRD_geral.md)
- [Homepage Amafil (referência visual)](../amafil-homepage.png)
