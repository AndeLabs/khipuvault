# Migration Guide: Adding Animations to Existing Components

Esta guía muestra cómo integrar el sistema de animaciones en componentes existentes de KhipuVault.

## 1. Componentes de Cards (Pool Stats, Position Card)

### Antes

```tsx
export function PositionCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Position</CardTitle>
      </CardHeader>
      <CardContent>{/* content */}</CardContent>
    </Card>
  );
}
```

### Después

```tsx
"use client";

import { motion } from "framer-motion";
import { cardEntrance, springTransition } from "@/lib/animations";

export function PositionCard() {
  return (
    <motion.div
      variants={cardEntrance}
      initial="hidden"
      animate="visible"
      transition={springTransition}
    >
      <Card>
        <CardHeader>
          <CardTitle>Your Position</CardTitle>
        </CardHeader>
        <CardContent>{/* content */}</CardContent>
      </Card>
    </motion.div>
  );
}
```

## 2. Modales (Deposit, Withdraw)

### Antes

```tsx
export function DepositModal({ isOpen, onClose }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>{/* content */}</DialogContent>
    </Dialog>
  );
}
```

### Después

```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { modalOverlay, modalContent, modalTransition } from "@/lib/animations";

export function DepositModal({ isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={modalTransition}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <DialogContent>{/* content */}</DialogContent>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

## 3. Listas de Transacciones

### Antes

```tsx
export function TransactionHistory({ transactions }: Props) {
  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div key={tx.id} className="rounded border p-4">
          {tx.type}
        </div>
      ))}
    </div>
  );
}
```

### Después

```tsx
"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

export function TransactionHistory({ transactions }: Props) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      {transactions.map((tx) => (
        <motion.div key={tx.id} variants={staggerItem} className="rounded border p-4">
          {tx.type}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

## 4. Grid de Stats

### Antes

```tsx
export function PoolStatistics() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard title="TVL" value="$1.2M" />
      <StatCard title="APY" value="12%" />
      <StatCard title="Users" value="450" />
    </div>
  );
}
```

### Después

```tsx
"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem, cardHover } from "@/lib/animations";

export function PoolStatistics() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 gap-4"
    >
      <motion.div variants={staggerItem}>
        <motion.div variants={cardHover} whileHover="hover">
          <StatCard title="TVL" value="$1.2M" />
        </motion.div>
      </motion.div>
      <motion.div variants={staggerItem}>
        <motion.div variants={cardHover} whileHover="hover">
          <StatCard title="APY" value="12%" />
        </motion.div>
      </motion.div>
      <motion.div variants={staggerItem}>
        <motion.div variants={cardHover} whileHover="hover">
          <StatCard title="Users" value="450" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
```

## 5. Scroll Reveal (Landing Page Sections)

### Antes

```tsx
export function HowItWorksSection() {
  return (
    <section className="py-12">
      <h2>How It Works</h2>
      <div className="grid grid-cols-3 gap-8">
        <Step number={1} title="Connect" />
        <Step number={2} title="Deposit" />
        <Step number={3} title="Earn" />
      </div>
    </section>
  );
}
```

### Después

```tsx
"use client";

import { motion } from "framer-motion";
import { useScrollAnimation, slideUp, staggerContainer, staggerItem } from "@/lib/animations";

export function HowItWorksSection() {
  const { ref, inView } = useScrollAnimation();

  return (
    <motion.section
      ref={ref}
      variants={slideUp}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className="py-12"
    >
      <h2>How It Works</h2>
      <motion.div variants={staggerContainer} className="grid grid-cols-3 gap-8">
        <motion.div variants={staggerItem}>
          <Step number={1} title="Connect" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <Step number={2} title="Deposit" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <Step number={3} title="Earn" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
```

## 6. Botones con Feedback

### Antes

```tsx
export function DepositButton({ onClick }: Props) {
  return <Button onClick={onClick}>Deposit mUSD</Button>;
}
```

### Después

```tsx
"use client";

import { motion } from "framer-motion";
import { springTransition } from "@/lib/animations";

export function DepositButton({ onClick }: Props) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={springTransition}
    >
      <Button onClick={onClick}>Deposit mUSD</Button>
    </motion.div>
  );
}
```

## 7. Loading States

### Antes

```tsx
export function PoolData() {
  const { data, isLoading } = usePoolData();

  if (isLoading) return <div>Loading...</div>;

  return <div>{data.value}</div>;
}
```

### Después

```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, pulse } from "@/lib/animations";

export function PoolData() {
  const { data, isLoading } = usePoolData();

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div key="loading" variants={pulse} initial="initial" animate="animate">
          Loading...
        </motion.div>
      ) : (
        <motion.div key="data" variants={fadeIn} initial="hidden" animate="visible">
          {data.value}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## 8. Page Transitions

### Antes

```tsx
export default function IndividualSavingsPage() {
  return (
    <div className="container mx-auto p-8">
      <h1>Individual Savings</h1>
      {/* content */}
    </div>
  );
}
```

### Después

```tsx
"use client";

import { motion } from "framer-motion";
import { fadeIn, springTransition } from "@/lib/animations";

export default function IndividualSavingsPage() {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={springTransition}
      className="container mx-auto p-8"
    >
      <h1>Individual Savings</h1>
      {/* content */}
    </motion.div>
  );
}
```

## Tips de Migración

### 1. Agrega 'use client' cuando sea necesario

Si el componente no lo tiene, agrégalo:

```tsx
"use client";
```

### 2. Respeta Reduced Motion

Usa el hook `useReducedMotion()` para animaciones complejas:

```tsx
const prefersReducedMotion = useReducedMotion();

<motion.div
  animate={prefersReducedMotion ? {} : { x: 100 }}
>
```

### 3. No Animes Todo

Anima solo elementos clave:

- Entradas de página
- Modales/Dialogs
- Transiciones de estado
- Hover en elementos interactivos
- Listas de datos

### 4. Prioridad de Performance

Solo anima propiedades performantes:

- `opacity` ✅
- `transform` (scale, translate, rotate) ✅
- `filter` ⚠️ (con cuidado)
- `width`, `height`, `top`, `left` ❌ (evita)

### 5. Testing

Verifica que las animaciones no rompan tests existentes. Usa `prefersReducedMotion` mock en tests:

```tsx
// En test setup
Object.defineProperty(window, "matchMedia", {
  value: () => ({
    matches: true, // Simulate reduced motion
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
});
```

## Orden de Migración Sugerido

1. **Páginas principales** (Dashboard, Individual Savings, etc.)
   - Añade fade-in básico

2. **Modales y Dialogs**
   - Usa modalOverlay + modalContent

3. **Cards y Stats**
   - Añade stagger para grids
   - Añade hover effects

4. **Listas**
   - Stagger animations para transacciones

5. **Botones**
   - Hover y tap effects

6. **Landing Page**
   - Scroll reveals

## Verificación Final

Después de cada migración:

```bash
# Check TypeScript
pnpm tsc -p apps/web/tsconfig.json --noEmit

# Run tests
pnpm test

# Build
pnpm build
```
