---
section: shared
document: design-system
status: complete
last_updated: 2026-01-12
---

# Design System

[← Voltar ao Índice](README.md)

---

## Visão Geral

O Design System do A-hub é **Vibrante e Bold**, combinando cores fortes com elementos neumórficos e cantos totalmente arredondados (pill). Suporta Light e Dark mode.

**Características:**
- Estilo: Vibrante/Bold com neumorfismo
- Temas: Light e Dark
- Border Radius: Pill (full rounded)
- Ícones: Phosphor Icons

---

## Cores

### Cores da Marca

| Nome | Hex | Uso |
|------|-----|-----|
| **Primary** | `#8B5CF6` | Ações principais, destaques, CTAs |
| **Secondary** | `#06B6D4` | Ações secundárias, links, acentos |

### Cores de Status (Pastéis)

| Nome | Hex | Uso |
|------|-----|-----|
| **Success** | `#86EFAC` | Confirmações, sucesso, check |
| **Warning** | `#FDE68A` | Alertas, atenção |
| **Error** | `#FCA5A5` | Erros, ações destrutivas |
| **Info** | `#93C5FD` | Informações, dicas |

### Cores Neutras

#### Light Mode

| Nome | Hex | Uso |
|------|-----|-----|
| **Background** | `#FAFAFA` | Fundo principal |
| **Surface** | `#FFFFFF` | Cards, modais |
| **Text Primary** | `#1F2937` | Texto principal |
| **Text Secondary** | `#6B7280` | Texto secundário |
| **Border** | `#E5E7EB` | Bordas, divisores |

#### Dark Mode

| Nome | Hex | Uso |
|------|-----|-----|
| **Background** | `#1A1A2E` | Fundo principal |
| **Surface** | `#252542` | Cards, modais |
| **Text Primary** | `#F9FAFB` | Texto principal |
| **Text Secondary** | `#9CA3AF` | Texto secundário |
| **Border** | `#374151` | Bordas, divisores |

### Gradientes

```css
/* Primary Gradient */
linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)

/* Accent Gradient */
linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)
```

---

## Tipografia

### Família

**Inter** - Fonte principal para todo o app

```
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

### Escala Tipográfica

| Token | Tamanho | Line Height | Peso | Uso |
|-------|---------|-------------|------|-----|
| **xs** | 12px | 16px | 400 | Captions, labels pequenos |
| **sm** | 14px | 20px | 400 | Body secundário, helpers |
| **base** | 16px | 24px | 400 | Body principal |
| **lg** | 18px | 28px | 500 | Subtítulos, destaques |
| **xl** | 24px | 32px | 600 | Títulos de seção |
| **2xl** | 32px | 40px | 700 | Títulos principais |

### Pesos

| Token | Peso | Uso |
|-------|------|-----|
| **regular** | 400 | Texto corrido |
| **medium** | 500 | Ênfase leve |
| **semibold** | 600 | Subtítulos, labels |
| **bold** | 700 | Títulos, CTAs |

---

## Espaçamento

Sistema base **8px** para consistência.

| Token | Valor | Uso |
|-------|-------|-----|
| **1** | 8px | Gaps mínimos, padding interno |
| **2** | 16px | Padding padrão, gaps entre elementos |
| **3** | 24px | Separação de grupos |
| **4** | 32px | Margens de seção |
| **6** | 48px | Espaçamento grande |
| **8** | 64px | Separação de áreas |

---

## Border Radius

Estilo **Pill** - cantos totalmente arredondados.

| Token | Valor | Uso |
|-------|-------|-----|
| **none** | 0px | Sem arredondamento |
| **sm** | 4px | Inputs, elementos sutis |
| **md** | 8px | Cards pequenos |
| **lg** | 16px | Cards grandes, modais |
| **xl** | 24px | Containers destacados |
| **full** | 9999px | Botões, badges, avatares, pills |

**Padrão:** Botões e badges usam `full` (pill).

---

## Sombras (Neumorfismo)

### Light Mode

```css
/* Elevação externa (cards, botões) */
box-shadow: 8px 8px 16px #d1d5db, -8px -8px 16px #ffffff;

/* Elevação interna (inputs, pressed) */
box-shadow: inset 4px 4px 8px #d1d5db, inset -4px -4px 8px #ffffff;

/* Hover (mais pronunciado) */
box-shadow: 12px 12px 24px #d1d5db, -12px -12px 24px #ffffff;
```

### Dark Mode

```css
/* Elevação externa (cards, botões) */
box-shadow: 8px 8px 16px #0f0f1a, -8px -8px 16px #252542;

/* Elevação interna (inputs, pressed) */
box-shadow: inset 4px 4px 8px #0f0f1a, inset -4px -4px 8px #252542;

/* Hover (mais pronunciado) */
box-shadow: 12px 12px 24px #0f0f1a, -12px -12px 24px #252542;
```

---

## Ícones

### Biblioteca

**Phosphor Icons** - https://phosphoricons.com/

### Estilos Disponíveis

| Estilo | Uso |
|--------|-----|
| **Regular (line)** | Padrão - navegação, ações |
| **Bold** | Ênfase, estados ativos |
| **Fill** | Estados selecionados |
| **Duotone** | Ilustrações, vazios |

### Tamanhos

| Token | Valor | Uso |
|-------|-------|-----|
| **sm** | 16px | Inline, indicadores |
| **md** | 20px | Botões, listas |
| **lg** | 24px | Navegação, ações principais |
| **xl** | 32px | Destaques, empty states |

---

## Componentes

### Botões

| Variante | Background | Text | Border |
|----------|------------|------|--------|
| **Primary** | `#8B5CF6` | `#FFFFFF` | none |
| **Secondary** | `#06B6D4` | `#FFFFFF` | none |
| **Outline** | transparent | `#8B5CF6` | `#8B5CF6` |
| **Ghost** | transparent | `#8B5CF6` | none |
| **Danger** | `#FCA5A5` | `#7F1D1D` | none |

**Especificações:**
- Border Radius: `full` (pill)
- Padding: `12px 24px`
- Font Weight: `600`
- Min Height: `44px` (acessibilidade)

### Cards

```css
/* Light Mode */
background: #FFFFFF;
border-radius: 16px;
box-shadow: 8px 8px 16px #d1d5db, -8px -8px 16px #ffffff;
padding: 24px;

/* Dark Mode */
background: #252542;
border-radius: 16px;
box-shadow: 8px 8px 16px #0f0f1a, -8px -8px 16px #252542;
padding: 24px;
```

### Inputs

```css
/* Light Mode */
background: #FAFAFA;
border-radius: 4px;
box-shadow: inset 4px 4px 8px #d1d5db, inset -4px -4px 8px #ffffff;
padding: 12px 16px;
font-size: 16px;

/* Focus */
outline: 2px solid #8B5CF6;
outline-offset: 2px;
```

### Badges/Pills

```css
background: #8B5CF6;
color: #FFFFFF;
border-radius: 9999px;
padding: 4px 12px;
font-size: 12px;
font-weight: 600;
```

---

## Estados

### Loading

- Skeleton com animação shimmer
- Cor: `#E5E7EB` (light) / `#374151` (dark)
- Animação: pulse 1.5s infinite

### Empty

- Ícone Phosphor duotone (xl)
- Texto secundário centralizado
- CTA opcional

### Error

- Borda: `#FCA5A5`
- Background: `#FEF2F2` (light) / `#450A0A` (dark)
- Ícone: Warning circle

### Success

- Borda: `#86EFAC`
- Background: `#F0FDF4` (light) / `#052E16` (dark)
- Ícone: Check circle

---

## Animações

### Duração

| Token | Valor | Uso |
|-------|-------|-----|
| **fast** | 150ms | Hovers, toggles |
| **normal** | 250ms | Transições gerais |
| **slow** | 400ms | Modais, overlays |

### Easing

```css
/* Padrão */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

/* Bounce (para CTAs) */
transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Feedback Tátil

- Ações principais: haptic medium
- Erros: haptic error
- Sucesso: haptic success

---

## Acessibilidade

### Contraste

- Texto sobre background: mínimo 4.5:1
- Texto grande (18px+): mínimo 3:1
- Elementos interativos: mínimo 3:1

### Touch Targets

- Mínimo: 44x44px
- Recomendado: 48x48px
- Espaçamento entre alvos: 8px

### Focus

```css
/* Focus visible */
outline: 2px solid #8B5CF6;
outline-offset: 2px;
```

---

## Relacionados

- [Acessibilidade](accessibility.md)
- [Responsividade](responsiveness.md)
- [Performance](performance.md)
