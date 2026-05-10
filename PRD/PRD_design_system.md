# Design System — MES Amafil

> **Tema:** exclusivamente claro (light). Não há dark mode.

Tokens de design e padrões de componentes para o sistema MES.

---

## Paleta principal

### Estrutura / layout

| Token | Hex | Uso |
|-------|-----|-----|
| `sidebar-bg` | `#FFFFFF` | Fundo da sidebar |
| `sidebar-border` | `#E5E7EB` | Borda direita da sidebar |
| `sidebar-active-bg` | `#EFF6FF` | Background do item de nav ativo |
| `sidebar-active-text` | `#2563EB` | Texto/ícone do item ativo |
| `sidebar-text` | `#6B7280` | Texto/ícone dos itens normais |
| `sidebar-hover-bg` | `#F5F6FA` | Hover nos itens de nav |
| `content-bg` | `#F5F6FA` | Fundo da área de conteúdo |
| `card-bg` | `#FFFFFF` | Fundo de cards e painéis |
| `border` | `#E5E7EB` | Bordas de card, separadores, linhas de tabela |
| `text-primary` | `#111827` | Títulos e valores em destaque |
| `text-secondary` | `#6B7280` | Labels, subtítulos, descrições |
| `text-tertiary` | `#9CA3AF` | Placeholders, textos desabilitados |
| `action-primary` | `#2563EB` | Botões primários, links ativos |

### Status / semântica

| Status | Texto | Background | Uso |
|--------|-------|------------|-----|
| Sucesso / Operando | `#16A34A` | `#DCFCE7` | Meta atingida, máquina operando |
| Atenção / Warning | `#D97706` | `#FEF3C7` | Alerta moderado, parada |
| Crítico / Erro | `#DC2626` | `#FEE2E2` | Falha, parado, erro |
| Offline / Inativo | `#9CA3AF` | `#F3F4F6` | Equipamento offline, desabilitado |
| Info / Primário | `#2563EB` | `#EFF6FF` | Ações primárias, item ativo |

### Gráficos — Categorias de parada

| Categoria | Hex |
|-----------|-----|
| Mecânica | `#EF4444` |
| Elétrica | `#F59E0B` |
| Material | `#3B82F6` |
| Operacional | `#8B5CF6` |
| Planejada | `#22C55E` |
| Qualidade | `#06B6D4` |

### Gráficos — Charts gerais

| Elemento | Hex |
|----------|-----|
| Barras realizado | `#2563EB` |
| Barras planejado | `#F59E0B` |
| Gauge disponibilidade | `#F59E0B` |
| Gauge performance | `#EF4444` |
| Gauge qualidade | `#16A34A` |
| Gauge OEE | `#2563EB` |

---

## Tipografia

Inter em todo o sistema.

| Elemento | Peso | Tamanho |
|----------|------|---------|
| KPI valor | 700 | 28–36px |
| Título de página | 700 | 20px |
| Título de seção / card | 600 | 14–16px |
| Label uppercase | 600 | 11px |
| Texto de tabela / corpo | 400 | 13px |
| Subtítulo / descrição | 400 | 13px, `#6B7280` |
| Badge / pill | 600 | 11px |

---

## Componentes

### Página — estrutura padrão
```
bg-[#F5F6FA] min-h-screen
  → Sidebar (w-60, bg-white, border-r #E5E7EB)
  → Header (h-16, bg-white, border-b #E5E7EB)
  → main (p-6)
```

### Sidebar — item de navegação
```
Inativo:  text-[#6B7280]  hover:bg-[#F5F6FA] hover:text-[#374151]
Ativo:    bg-[#EFF6FF] text-[#2563EB]
border-radius: 8px, padding: 10px 12px
```

### Login
```
Fundo da página: bg-[#F5F6FA]
Logo centralizada acima do card (sem fundo escuro)
Card: bg-white border border-[#E5E7EB] shadow-lg rounded-2xl
Spinner de loading: border-[#2563EB]
```

### Card / painel
```
bg-white rounded-xl border border-[#E5E7EB] shadow-sm
Header interno: px-5 py-4 border-b border-[#E5E7EB]
```

### Badge de status (pill)
```
border-radius: 9999px
padding: 2px 10px
font: 11–12px, weight 600

Sucesso:  bg #DCFCE7, text #16A34A
Atenção:  bg #FEF3C7, text #D97706
Crítico:  bg #FEE2E2, text #DC2626
Offline:  bg #F3F4F6, text #9CA3AF
Info:     bg #EFF6FF, text #2563EB
```

### Botão primário
```
bg-[#2563EB] text-white hover:bg-[#1D4ED8]
h-10 px-4 rounded-lg text-[13–14px] font-medium
disabled: opacity-60
```

### Botão secundário
```
bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F5F6FA]
h-10 px-3 rounded-lg text-[13px]
```

### Input / select
```
h-10 rounded-lg border border-[#E5E7EB] px-3 text-[14px] text-[#111827]
focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20
erro: border-[#DC2626] focus:ring-[#DC2626]/20
```

### Tabela
```
Header: bg-[#F9FAFB], text-[11px] uppercase text-[#6B7280] font-semibold
Linha: divide-y divide-[#F3F4F6], hover:bg-[#F9FAFB]
Footer/totais: border-t-2 border-[#E5E7EB] bg-[#F9FAFB] font-semibold
```

### Eficiência — badge por faixa
```
≥ 85%:    text #16A34A, bg #DCFCE7
70–84%:   text #D97706, bg #FEF3C7
< 70%:    text #DC2626, bg #FEE2E2
```

---

## CSS tokens (referência)

```css
--color-sidebar-bg:          #FFFFFF;
--color-sidebar-border:      #E5E7EB;
--color-sidebar-active-bg:   #EFF6FF;
--color-sidebar-active-text: #2563EB;
--color-sidebar-text:        #6B7280;
--color-sidebar-hover-bg:    #F5F6FA;
--color-content-bg:          #F5F6FA;
--color-card-bg:             #FFFFFF;
--color-border:              #E5E7EB;
--color-text-primary:        #111827;
--color-text-secondary:      #6B7280;
--color-action-primary:      #2563EB;
--color-success:             #16A34A;
--color-success-bg:          #DCFCE7;
--color-warning:             #D97706;
--color-warning-bg:          #FEF3C7;
--color-danger:              #DC2626;
--color-danger-bg:           #FEE2E2;
--color-offline:             #9CA3AF;
--color-offline-bg:          #F3F4F6;
--color-mechanical:          #EF4444;
--color-electrical:          #F59E0B;
--color-material:            #3B82F6;
--color-operator:            #8B5CF6;
--color-planned:             #22C55E;
```
