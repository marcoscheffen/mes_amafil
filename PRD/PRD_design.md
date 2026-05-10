# PRD Design — Identidade Visual Amafil

Mapeamento realizado em: **amafil.com.br** (05/05/2026)

---

## Logo

| Variante | URL |
|----------|-----|
| Principal (SVG) | `https://amafil.com.br/wp-content/uploads/2025/10/logo.svg` |

**Dimensões originais:** 148 × 71 px  
**Formato:** SVG vetorial

### Cores presentes na logo

| Cor | Hex | Uso na logo |
|-----|-----|-------------|
| Verde primário | `#00AA4D` | Fundo/forma principal |
| Verde escuro | `#0C9445` | Sombra / profundidade |
| Vermelho | `#EC1B23` | Letras "AMAFIL" |
| Vermelho escuro | `#DA1C12` | Variante letras |
| Amarelo | `#FFF366` | Faixa/destaque |
| Amarelo puro | `#FFF100` | Detalhe |
| Branco | `#FFFFFF` | Contraste interno |

---

## Paleta de Cores do Site

### Cores primárias

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| Verde Amafil | `#00AA4D` | rgb(0, 170, 77) | Cor de marca, logo |
| Azul institucional | `#2B57A3` | rgb(43, 87, 163) | Headings (h2), botões |
| Azul alternativo | `#2956A3` | rgb(41, 86, 163) | Background de botões |

### Cores secundárias / UI

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| Vermelho | `#EC1B23` | rgb(236, 27, 35) | Logo, destaques |
| Amarelo | `#FFF366` | rgb(255, 243, 102) | Logo, faixa |
| Rosa/link | `#CC3366` | rgb(204, 51, 102) | Links (`<a>`) |

### Neutros

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| Texto padrão | `#333333` | rgb(51, 51, 51) | Corpo de texto |
| Branco | `#FFFFFF` | rgb(255, 255, 255) | Background geral, menu |
| Cinza claro | `#F5F7FA` | — | Fundos de seção |
| Cinza borda | `#E6E9ED` | — | Bordas / divisores |
| Cinza escuro | `#434A54` | — | Ícones / elementos UI |

---

## Tipografia

| Fonte | Uso |
|-------|-----|
| **Rubik** | Fonte principal — body, nav, headings, footer |
| **Inter** | Fonte secundária — botões |

---

## Padrão Visual Geral

- **Estilo:** Clean / institucional com identidade nacional (cores da bandeira brasileira na logo: verde, amarelo, branco)
- **Header:** Fundo transparente sobre banner; menu em texto branco
- **Botões:** Background azul (`#2956A3`), texto branco, borda arredondada
- **Headings:** Azul institucional (`#2B57A3`)
- **Links:** Rosa/vermelho (`#CC3366`)
- **Fundo geral:** Branco com seções em cinza claro (`#F5F7FA`)
- **Logo no footer:** Versão colorida sobre fundo escuro

---

## Referências para o Projeto

```
Logo SVG: https://amafil.com.br/wp-content/uploads/2025/10/logo.svg

Fonte primária: Rubik (Google Fonts)
Fonte secundária: Inter (Google Fonts)

Cor primária verde: #00AA4D
Cor primária azul:  #2B57A3
Cor texto:          #333333
Cor background:     #FFFFFF
```

---

# Design System — Interface MES (Manufacturing Execution System)

Referência visual baseada nos mockups do sistema MES com telas: Executive Dashboard, Daily Report, Downtime Analysis e Production.

> **Tema:** exclusivamente claro (light). Não há dark mode — toda a interface usa fundos brancos e cinza claro.

---

## Layout Estrutural

```
┌──────────────┬────────────────────────────────────────┐
│   Sidebar    │           Content Area                  │
│  (240px)     │     (fundo cinza claro #F5F6FA)         │
│  branco      │                                         │
│  borda dir.  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│              │  │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │  │
│  [Logo]      │  │ card │ │ card │ │ card │ │ card │  │
│              │  └──────┘ └──────┘ └──────┘ └──────┘  │
│  > Dashboard │                                         │
│  > Daily     │  ┌──────────────┐ ┌────────────────┐   │
│  > Downtime  │  │  Chart / Grid│ │  Chart / List  │   │
│  > Production│  └──────────────┘ └────────────────┘   │
│  > Alerts    │                                         │
│  > Operators │                                         │
│  > Settings  │                                         │
└──────────────┴────────────────────────────────────────┘
```

- **Sidebar fixa:** largura ~240px, fundo branco (`#FFFFFF`), borda direita `#E5E7EB`
- **Content area:** fundo cinza claro `#F5F6FA`, padding interno, cards brancos com sombra suave
- **Borda arredondada dos cards:** ~12px
- **Indicador "Live":** badge verde com ponto pulsante

---

## Paleta do Sistema MES

### Cores de estrutura / layout

| Nome | Hex | Uso |
|------|-----|-----|
| Sidebar background | `#FFFFFF` | Fundo do menu lateral — **tema claro** |
| Sidebar item ativo (bg) | `#EFF6FF` | Highlight do item selecionado |
| Sidebar item ativo (texto) | `#2563EB` | Texto/ícone do item ativo |
| Sidebar item inativo | `#6B7280` | Texto/ícone dos itens normais |
| Sidebar hover | `#F5F6FA` | Fundo ao passar o mouse |
| Content background | `#F5F6FA` | Fundo da área de conteúdo |
| Card background | `#FFFFFF` | Fundo dos cards e painéis |
| Texto principal | `#111827` | Títulos e valores em destaque |
| Texto secundário | `#6B7280` | Labels, subtítulos, descrições |
| Borda/divisor | `#E5E7EB` | Linhas de tabela, separadores, bordas de card |

### Cores de status / semântica

| Status | Hex | Uso |
|--------|-----|-----|
| On Track / Running / Good | `#16A34A` | Verde — meta atingida, máquina operando |
| On Track (bg badge) | `#DCFCE7` | Fundo badge verde |
| At Risk / Warning | `#F59E0B` | Âmbar — atenção, alerta moderado |
| Warning (bg badge) | `#FEF3C7` | Fundo badge âmbar |
| Critical / Stopped / Bad | `#EF4444` | Vermelho — falha crítica, parado |
| Critical (bg badge) | `#FEE2E2` | Fundo badge vermelho |
| Offline / Inactive | `#9CA3AF` | Cinza — equipamento offline |
| Offline (bg badge) | `#F3F4F6` | Fundo badge cinza |
| Azul primário (botões, links) | `#2563EB` | Ações primárias, export Excel |

### Cores dos gráficos — Downtime por categoria

| Categoria | Hex | Nome |
|-----------|-----|------|
| Mechanical | `#EF4444` | Vermelho |
| Electrical | `#F59E0B` | Âmbar |
| Material | `#3B82F6` | Azul |
| Operator | `#8B5CF6` | Roxo |
| Planned Maintenance | `#22C55E` | Verde |

### Cores dos gráficos — Charts gerais

| Elemento | Hex | Uso |
|----------|-----|-----|
| Barras principais (Actual) | `#2563EB` | Produção real, OEE trend |
| Barras Plan | `#F59E0B` | Produção planejada |
| Gauge — Availability | `#F59E0B` | Semicírculo âmbar |
| Gauge — Performance | `#EF4444` | Semicírculo vermelho |
| Gauge — Quality | `#16A34A` | Semicírculo verde |

---

## Tipografia

| Elemento | Fonte | Peso | Tamanho ref. |
|----------|-------|------|--------------|
| Logo / marca | Inter | 700 | 14–16px |
| KPI valor (número grande) | Inter | 700 | 36–48px |
| Título de seção | Inter | 600 | 18–22px |
| Label de card / badge | Inter | 600 | 12–13px uppercase |
| Texto corpo / tabela | Inter | 400 | 14px |
| Subtítulo / meta | Inter | 400 | 13px, cinza |

---

## Componentes

### KPI Card
- Fundo branco, borda-esquerda colorida (4px) indicando status
- Título uppercase pequeno (`#6B7280`)
- Valor grande e bold
- Badge de status (pill arredondado) no canto superior direito
- Linha de progresso ou seta de tendência abaixo do valor

### Badge de Status
```
Formato: pill (border-radius: 9999px)
Padding: 2px 10px
Font: 12px, weight 600, uppercase

On Track:  bg #DCFCE7, text #16A34A
At Risk:   bg #FEF3C7, text #D97706
Critical:  bg #FEE2E2, text #DC2626
```

### Machine Status Card
```
Borda colorida conforme status (verde/vermelho/âmbar/cinza)
Ponto indicador no topo (●)
Label com código da máquina (bold)
Status text abaixo (uppercase, cor do status)
Borda-radius: ~8px
```

### Gauge (Semicírculo OEE)
- Semicírculo com trilha cinza claro e arco colorido
- Valor percentual centralizado, bold, cor do arco
- Label abaixo: nome do componente (uppercase)
- Sub-label: "Target: XX%"

### Tabela de Dados
- Header: uppercase, `#6B7280`, font-size 12px, peso 500
- Linhas alternadas com separador `#E5E7EB`
- Coluna de badge colorido por categoria
- Valores percentuais com pill colorido (verde/âmbar/vermelho conforme performance)
- Paginação com botão ativo azul `#2563EB`

### Alert Panel
- Borda-esquerda 4px vermelha (critical) ou âmbar (warning)
- Fundo levemente tingido (bg `#FEE2E2` ou `#FEF3C7`)
- Ícone ⚠ ou ⊘ com cor do severity
- Título bold, descrição regular
- Timestamp alinhado à direita

### Sidebar Navigation (tema claro)
- Fundo: `#FFFFFF`
- Borda direita: `1px solid #E5E7EB`
- Item padrão: texto `#6B7280`, sem fundo
- Item hover: fundo `#F5F6FA`, texto `#374151`
- Item ativo: fundo `#EFF6FF`, texto `#2563EB`, border-radius 8px
- Ícone + label em linha

### Login / Tela de autenticação
- Fundo da página: `#F5F6FA`
- Logo centralizada acima do card, sem fundo dark
- Card: branco, `border border-[#E5E7EB]`, `shadow-lg`, `rounded-2xl`
- Spinner de loading: azul `#2563EB`

---

## Padrão de Cores por Performance (tabela)

| Faixa | Cor texto | Cor background | Interpretação |
|-------|-----------|----------------|---------------|
| ≥ 85% | `#16A34A` | `#DCFCE7` | Bom / On Track |
| 70–84% | `#D97706` | `#FEF3C7` | Atenção / At Risk |
| < 70% | `#DC2626` | `#FEE2E2` | Crítico |

---

## Tokens de Design (referência para implementação)

```css
/* Estrutura */
--color-sidebar-bg:          #FFFFFF;
--color-sidebar-border:      #E5E7EB;
--color-sidebar-active-bg:   #EFF6FF;
--color-sidebar-active-text: #2563EB;
--color-sidebar-text:        #6B7280;
--color-sidebar-hover-bg:    #F5F6FA;
--color-content-bg:          #F5F6FA;
--color-card-bg:             #FFFFFF;
--color-border:              #E5E7EB;

/* Texto */
--color-text-primary:    #111827;
--color-text-secondary:  #6B7280;

/* Ações */
--color-action-primary:  #2563EB;

/* Status */
--color-success:         #16A34A;
--color-success-bg:      #DCFCE7;
--color-warning:         #D97706;
--color-warning-bg:      #FEF3C7;
--color-danger:          #DC2626;
--color-danger-bg:       #FEE2E2;
--color-offline:         #9CA3AF;
--color-offline-bg:      #F3F4F6;

/* Downtime categories */
--color-mechanical:      #EF4444;
--color-electrical:      #F59E0B;
--color-material:        #3B82F6;
--color-operator:        #8B5CF6;
--color-planned:         #22C55E;
```
