# A-hub Design System

Documentacao do design system mobile-first do A-hub, inspirado em apps de banco como Nubank e Inter.

## Indice

1. [Paleta de Cores](#paleta-de-cores)
2. [Tipografia](#tipografia)
3. [Espacamento](#espacamento)
4. [Border Radius](#border-radius)
5. [Sombras](#sombras)
6. [Animacoes](#animacoes)
7. [Componentes](#componentes)
8. [Padroes de Uso](#padroes-de-uso)
9. [Responsividade](#responsividade)
10. [Boas Praticas e Armadilhas](#boas-praticas-e-armadilhas)

---

## Paleta de Cores

### Cores Primarias

| Nome | Hex | HSL | Uso |
|------|-----|-----|-----|
| Primary | `#a855f7` | `271 91% 65%` | Cor principal, botoes, links, destaque |
| Secondary | `#f43f5e` | `347 77% 50%` | Acentos, badges, CTAs secundarios |

### Escala Primary (Purple)

```
50:  #faf5ff  - Backgrounds muito sutis
100: #f3e8ff  - Backgrounds hover
200: #e9d5ff  - Borders, dividers
300: #d8b4fe  - Decoracoes
400: #c084fc  - Icones inativos
500: #a855f7  - Cor principal
600: #9333ea  - Hover states
700: #7c22ce  - Active states
800: #6b21a8  - Texto em fundos claros
900: #581c87  - Texto emphasis
```

### Escala Secondary (Rose)

```
50:  #fff1f2  - Backgrounds muito sutis
100: #ffe4e6  - Backgrounds hover
200: #fecdd3  - Borders, dividers
300: #fda4af  - Decoracoes
400: #fb7185  - Icones inativos
500: #f43f5e  - Cor principal
600: #e11d48  - Hover states
700: #be123c  - Active states
800: #9f1239  - Texto em fundos claros
900: #881337  - Texto emphasis
```

### Cores de Status

| Status | Classe CSS | Uso |
|--------|------------|-----|
| Success | `from-emerald-500 to-teal-500` | Sucesso, aprovado, ativo |
| Warning | `from-amber-500 to-orange-500` | Atencao, pendente |
| Error | `from-red-500 to-rose-500` | Erro, rejeitado, cancelado |
| Info | `from-cyan-500 to-blue-500` | Informativo |

### Gradientes

```css
/* Primary */
.gradient-primary {
  background: linear-gradient(135deg, #a855f7 0%, #d946ef 100%);
}

/* Secondary */
.gradient-secondary {
  background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%);
}

/* Success */
.gradient-success {
  background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
}

/* Warning */
.gradient-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
}

/* Info */
.gradient-info {
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
}
```

---

## Tipografia

### Fonte

A fonte padrao e a fonte do sistema (`system-ui`, `-apple-system`, `BlinkMacSystemFont`).

### Tamanhos

| Nome | Tamanho | Line Height | Uso |
|------|---------|-------------|-----|
| 2xs | 0.625rem (10px) | 0.875rem | Labels muito pequenos |
| xs | 0.75rem (12px) | 1rem | Labels, captions |
| sm | 0.875rem (14px) | 1.25rem | Texto secundario, sublabels |
| base | 1rem (16px) | 1.5rem | Texto padrao |
| lg | 1.125rem (18px) | 1.75rem | Subtitulos |
| xl | 1.25rem (20px) | 1.75rem | Titulos de secao |
| 2xl | 1.5rem (24px) | 2rem | Titulos principais |
| 3xl | 1.875rem (30px) | 2.25rem | Hero titles |

### Pesos

| Nome | Valor | Uso |
|------|-------|-----|
| normal | 400 | Texto corrido |
| medium | 500 | Labels, botoes |
| semibold | 600 | Subtitulos, destaque |
| bold | 700 | Titulos, numeros grandes |
| extrabold | 800 | Hero text |

---

## Espacamento

Escala base de espacamento (baseada em 4px):

| Nome | Valor | Pixels |
|------|-------|--------|
| 0.5 | 0.125rem | 2px |
| 1 | 0.25rem | 4px |
| 1.5 | 0.375rem | 6px |
| 2 | 0.5rem | 8px |
| 3 | 0.75rem | 12px |
| 4 | 1rem | 16px |
| 5 | 1.25rem | 20px |
| 6 | 1.5rem | 24px |
| 8 | 2rem | 32px |
| 10 | 2.5rem | 40px |
| 12 | 3rem | 48px |
| 16 | 4rem | 64px |

### Uso Recomendado

- **Padding de cards**: `p-4` (16px) ou `p-6` (24px)
- **Gap entre elementos**: `gap-2` (8px), `gap-3` (12px), `gap-4` (16px)
- **Margin entre secoes**: `space-y-6` (24px)
- **Padding de pagina**: `p-4` mobile, `p-6` desktop

---

## Border Radius

| Nome | Valor | Uso |
|------|-------|-----|
| sm | calc(0.75rem - 4px) = 8px | Inputs pequenos |
| md | calc(0.75rem - 2px) = 10px | Buttons, badges |
| lg | 0.75rem = 12px | Cards padrao |
| xl | calc(0.75rem + 4px) = 16px | Cards destacados |
| 2xl | calc(0.75rem + 8px) = 20px | Hero cards |
| 3xl | calc(0.75rem + 16px) = 28px | Modais |
| full | 9999px | Avatares, pills |

### Uso Recomendado

- **Cards**: `rounded-2xl` (20px)
- **Botoes**: `rounded-xl` (16px)
- **Bottom Nav**: `rounded-t-3xl` (28px)
- **Avatares**: `rounded-full`
- **Icone containers**: `rounded-xl` (16px)

---

## Sombras

### Sombras de Elevation

```css
/* Card padrao */
.shadow-card {
  box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.08),
              0 4px 16px -4px rgba(0, 0, 0, 0.08);
}

/* Card hover */
.shadow-card-hover {
  box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.12),
              0 4px 16px -4px rgba(0, 0, 0, 0.08);
}
```

### Sombras com Glow

```css
/* Primary glow */
.shadow-glow {
  box-shadow: 0 4px 20px -2px rgba(168, 85, 247, 0.4);
}

/* Secondary glow */
.shadow-glow-secondary {
  box-shadow: 0 4px 20px -2px rgba(244, 63, 94, 0.4);
}
```

### Classes Utilitarias

- `.glow-primary` - Glow roxo
- `.glow-secondary` - Glow rosa
- `.glow-success` - Glow verde
- `.glow-warning` - Glow amarelo
- `.glow-info` - Glow azul

---

## Animacoes

### Duracoes

| Nome | Valor | Uso |
|------|-------|-----|
| fast | 150ms | Hover states |
| normal | 300ms | Transicoes padrao |
| slow | 500ms | Entradas de pagina |

### Easing Functions

```css
/* Padrao suave */
ease-out: cubic-bezier(0.4, 0, 0.2, 1)

/* Spring (bounce) */
spring: cubic-bezier(0.68, -0.55, 0.265, 1.55)

/* Ease out back */
ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Animacoes Disponiveis

| Nome | Uso |
|------|-----|
| `animate-fade-in` | Entrada com fade |
| `animate-scale-in` | Entrada com scale |
| `animate-slide-in-bottom` | Entrada de baixo |
| `animate-slide-in-right` | Entrada da direita |
| `animate-pulse-soft` | Pulsacao suave |
| `animate-bounce-soft` | Bounce suave |
| `animate-shimmer` | Loading skeleton |

### Framer Motion Patterns

```tsx
// Container com stagger
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Item com spring
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

// Uso
<motion.div variants={containerVariants} initial="hidden" animate="show">
  <motion.div variants={itemVariants}>Item 1</motion.div>
  <motion.div variants={itemVariants}>Item 2</motion.div>
</motion.div>
```

---

## Componentes

### GradientCard

Card com gradiente e efeitos visuais.

```tsx
import { GradientCard } from '@/components/core/gradient-card';

<GradientCard
  variant="primary" // primary | secondary | success | warning | info | dark
  hasGlow={true}
  interactive={true}
  withDecoration={true}
>
  Conteudo
</GradientCard>
```

### ModernBottomNav

Navegacao inferior com animacoes.

```tsx
import { ModernBottomNav } from '@/components/navigation/modern-bottom-nav';

<ModernBottomNav className="md:hidden" />
```

### FloatingActionButton

Botao de acao flutuante expansivel.

```tsx
import { FloatingActionButton } from '@/components/navigation/floating-action-button';

<FloatingActionButton
  actions={[
    { icon: Calendar, label: 'Nova Reserva', onClick: () => {} },
    { icon: QrCode, label: 'Check-in', onClick: () => {} },
  ]}
/>
```

### PullToRefresh

Wrapper para pull-to-refresh em mobile.

```tsx
import { PullToRefresh } from '@/components/feedback/pull-to-refresh';

<PullToRefresh onRefresh={async () => await loadData()}>
  {children}
</PullToRefresh>
```

### BottomSheet

Modal que sobe de baixo.

```tsx
import { BottomSheet } from '@/components/feedback/bottom-sheet';

<BottomSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Titulo"
>
  Conteudo
</BottomSheet>
```

### HeroCard

Card hero da dashboard com saudacao e saldo.

```tsx
import { HeroCard } from '@/components/dashboard/hero-card';

<HeroCard
  userName="Joao Silva"
  userPhoto="/photo.jpg"
  balance={1234}
/>
```

### QuickAccessGrid

Grid 2x2 de acoes rapidas.

```tsx
import { QuickAccessGrid } from '@/components/dashboard/quick-access-grid';

<QuickAccessGrid
  pointsBalance={1000}
  upcomingBookingsCount={3}
/>
```

### ShortcutCarousel

Carrossel horizontal de atalhos.

```tsx
import { ShortcutCarousel } from '@/components/dashboard/shortcut-carousel';

<ShortcutCarousel />
```

---

## Padroes de Uso

### Touch Feedback

Sempre adicione feedback visual ao toque:

```tsx
// Classe CSS
<button className="touch-feedback">Botao</button>

// Framer Motion
<motion.button whileTap={{ scale: 0.95 }}>Botao</motion.button>
```

### Loading States

Use skeletons com animacao shimmer:

```tsx
<div className="skeleton h-32 rounded-2xl" />
```

### Cards Interativos

Adicione hover e tap states:

```tsx
<motion.div
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.98 }}
  className="rounded-2xl shadow-card hover:shadow-card-hover transition-shadow"
>
```

### Glassmorphism

Para overlays e navegacao:

```tsx
<div className="glass backdrop-blur-xl">
  {/* ou */}
<div className="bg-white/90 backdrop-blur-xl">
```

---

## Responsividade

### Breakpoints

| Nome | Largura | Uso |
|------|---------|-----|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet / Desktop threshold |
| lg | 1024px | Desktop |
| xl | 1280px | Desktop wide |
| 2xl | 1400px | Desktop ultrawide (container max) |

### Padroes

```tsx
// Esconder em mobile, mostrar em desktop
<div className="hidden md:flex">Sidebar</div>

// Esconder em desktop, mostrar em mobile
<div className="md:hidden">Bottom Nav</div>

// Grid responsivo
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">

// Padding responsivo
<div className="p-4 md:p-6">
```

### Safe Areas (iOS)

```tsx
// Bottom nav / fixed elements
<div className="safe-area-inset-bottom">

// Top headers
<div className="safe-area-top">
```

---

## Implementando Novas Telas

### Checklist

1. [ ] Use `motion.div` com variants para animacoes de entrada
2. [ ] Implemente skeleton loading
3. [ ] Adicione touch feedback em elementos interativos
4. [ ] Use gradientes para destaque visual
5. [ ] Mantenha consistencia de espacamento (gap-3, space-y-6)
6. [ ] Use rounded-2xl para cards
7. [ ] Adicione sombras com glow quando apropriado
8. [ ] Teste em mobile (gestos, safe areas)

### Template de Pagina

```tsx
'use client';

import { motion } from 'framer-motion';
import { PullToRefresh } from '@/components/feedback/pull-to-refresh';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function MinhaPage() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6 pb-8"
      >
        <motion.div variants={itemVariants}>
          {/* Conteudo */}
        </motion.div>
      </motion.div>
    </PullToRefresh>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-32 rounded-2xl" />
      <div className="skeleton h-48 rounded-2xl" />
    </div>
  );
}
```

---

## Boas Praticas e Armadilhas

### Elementos Fixos (Fixed Position)

**IMPORTANTE:** Elementos com `position: fixed` devem ficar FORA de containers animados como `PullToRefresh` ou `motion.div`.

```tsx
// ERRADO - Card fixo dentro do PullToRefresh
return (
  <PullToRefresh>
    <motion.div>
      {/* conteudo */}
      <div className="fixed bottom-20">Card Fixo</div> {/* VAI BUGAR */}
    </motion.div>
  </PullToRefresh>
);

// CORRETO - Card fixo fora do PullToRefresh
return (
  <>
    <PullToRefresh>
      <motion.div className="pb-32"> {/* padding para espaco do card */}
        {/* conteudo */}
      </motion.div>
    </PullToRefresh>

    {/* Card fixo FORA do container animado */}
    <div className="fixed bottom-20 left-0 right-0 px-4 z-50">
      <div className="bg-white rounded-2xl shadow-lg p-4">
        Card Fixo
      </div>
    </div>
  </>
);
```

### GradientCard vs Card Simples

**GradientCard** tem animacao propria (`initial`, `animate`). Evite usar em elementos fixos ou que precisam de controle preciso de posicao.

```tsx
// EVITAR para elementos fixos
<GradientCard className="fixed bottom-20">...</GradientCard>

// PREFERIR card simples com botao gradiente
<div className="fixed bottom-20 bg-white rounded-2xl shadow-lg p-4">
  <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600">
    Acao
  </Button>
</div>
```

### Gradiente de Texto

**Gradiente de texto** (`bg-clip-text text-transparent`) pode ter problemas de renderizacao em alguns contextos. Para precos e valores importantes, prefira cor solida.

```tsx
// PODE TER PROBLEMAS em alguns contextos
<span className="bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
  R$ 300.00
</span>

// MAIS SEGURO para precos
<span className="text-primary font-bold">
  R$ 300.00
</span>

// GRADIENTE OK para elementos decorativos (icones, badges)
<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500">
  <Icon className="text-white" />
</div>
```

### Padding para Cards Fixos

Sempre adicione `padding-bottom` suficiente ao conteudo quando usar cards fixos no rodape:

```tsx
// Mobile: bottom-20 (80px) + altura do card (~80px) = pb-32 (128px)
<motion.div className="pb-32">
  {/* conteudo que precisa de espaco para o card fixo */}
</motion.div>

<div className="fixed bottom-20 ...">
  {/* card fixo */}
</div>
```

### Posicionamento Mobile vs Desktop

```tsx
// Card fixo responsivo
<div className={cn(
  "fixed left-0 right-0 px-4 z-50",
  "bottom-20",      // Mobile: acima da bottom nav
  "md:bottom-4"     // Desktop: mais proximo do rodape
)}>
  <div className="max-w-lg mx-auto"> {/* Limita largura no desktop */}
    {/* conteudo */}
  </div>
</div>
```

---

## Arquivos Importantes

| Arquivo | Descricao |
|---------|-----------|
| `app/globals.css` | Variaveis CSS, animacoes, utilitarios |
| `tailwind.config.ts` | Tokens de design, cores, sombras |
| `components/core/` | Componentes base reutilizaveis |
| `components/navigation/` | Componentes de navegacao |
| `components/feedback/` | Componentes de interacao |
| `components/dashboard/` | Componentes especificos da dashboard |

---

*Design System v1.0 - A-hub Mobile-First*
