# Animation System

Sistema de animaciones reutilizable basado en Framer Motion para KhipuVault.

## Instalación

El sistema ya está configurado y listo para usar. Framer Motion viene pre-instalado.

## Uso Básico

```tsx
"use client";

import { motion } from "framer-motion";
import { fadeIn, springTransition, useReducedMotion } from "@/lib/animations";

export function MyComponent() {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={springTransition}>
      Content
    </motion.div>
  );
}
```

## Variants Disponibles

### Fade Animations

```tsx
import { fadeIn, fadeOut } from "@/lib/animations";

<motion.div variants={fadeIn} initial="hidden" animate="visible">
  Fade in content
</motion.div>;
```

### Slide Animations

```tsx
import { slideUp, slideDown, slideLeft, slideRight } from "@/lib/animations";

<motion.div variants={slideUp} initial="hidden" animate="visible">
  Slides up from bottom
</motion.div>;
```

### Scale Animations

```tsx
import { scaleIn, scaleOut } from "@/lib/animations";

<motion.div variants={scaleIn} initial="hidden" animate="visible">
  Scales in
</motion.div>;
```

### Stagger Animations (Listas)

```tsx
import { staggerContainer, staggerItem, staggerTransition } from "@/lib/animations";

<motion.ul
  variants={staggerContainer}
  initial="hidden"
  animate="visible"
  transition={staggerTransition}
>
  {items.map((item) => (
    <motion.li key={item.id} variants={staggerItem}>
      {item.name}
    </motion.li>
  ))}
</motion.ul>;
```

### Card Animations

```tsx
import { cardHover, cardEntrance } from '@/lib/animations';

// Card con hover
<motion.div
  variants={cardHover}
  initial="initial"
  whileHover="hover"
  whileTap="tap"
>
  Hover me
</motion.div>

// Card con entrada animada
<motion.div variants={cardEntrance} initial="hidden" animate="visible">
  Card content
</motion.div>
```

### Modal Animations

```tsx
import { modalOverlay, modalContent, modalTransition } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";

<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        variants={modalOverlay}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 bg-black/50"
      />
      <motion.div
        variants={modalContent}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={modalTransition}
        className="fixed inset-0 flex items-center justify-center"
      >
        Modal content
      </motion.div>
    </>
  )}
</AnimatePresence>;
```

### Drawer/Sheet Animations

```tsx
import { drawerLeft, drawerRight, drawerBottom } from "@/lib/animations";

<motion.div variants={drawerRight} initial="hidden" animate="visible" exit="exit">
  Drawer content
</motion.div>;
```

## Transitions Disponibles

```tsx
import {
  springTransition, // Suave y natural
  softSpringTransition, // Muy suave
  bouncySpringTransition, // Rebote
  easeTransition, // Ease predecible
  quickTransition, // Rápido
  slowTransition, // Lento
  modalTransition, // Para modales
  pageTransition, // Para páginas
} from "@/lib/animations";

<motion.div
  variants={fadeIn}
  transition={springTransition} // Elige tu transición
>
  Content
</motion.div>;
```

## Hooks de Animación

### useReducedMotion

Detecta si el usuario prefiere movimiento reducido:

```tsx
import { useReducedMotion } from "@/lib/animations";

export function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{
        x: prefersReducedMotion ? 0 : 100,
      }}
    >
      Content
    </motion.div>
  );
}
```

### useScrollAnimation

Anima elementos cuando entran al viewport:

```tsx
import { useScrollAnimation, fadeIn } from "@/lib/animations";

export function MyComponent() {
  const { ref, inView } = useScrollAnimation();

  return (
    <motion.div
      ref={ref}
      variants={fadeIn}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      Animates on scroll
    </motion.div>
  );
}
```

### usePresence

Controla la presencia de componentes con animación:

```tsx
import { usePresence } from "@/lib/animations";

export function MyComponent({ isVisible }: { isVisible: boolean }) {
  const isPresent = usePresence(isVisible);

  if (!isPresent) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: isVisible ? 1 : 0 }}>
      Content
    </motion.div>
  );
}
```

### useAnimationState

Maneja estados de animación complejos:

```tsx
import { useAnimationState } from "@/lib/animations";

export function MyComponent() {
  const [state, setState] = useAnimationState<"idle" | "loading" | "success">("idle");

  return (
    <motion.div animate={state}>
      <button onClick={() => setState("loading")}>Load</button>
    </motion.div>
  );
}
```

### useHoverAnimation

Gestiona estados de hover con soporte de reducción de movimiento:

```tsx
import { useHoverAnimation } from "@/lib/animations";

export function MyComponent() {
  const { isHovered, hoverProps } = useHoverAnimation();

  return (
    <motion.div {...hoverProps} animate={{ scale: isHovered ? 1.1 : 1 }}>
      Hover me
    </motion.div>
  );
}
```

## Accesibilidad

Todas las animaciones respetan automáticamente `prefers-reduced-motion`:

```tsx
import { useAccessibleAnimation } from "@/lib/animations";

export function MyComponent() {
  const { shouldAnimate, animateProps } = useAccessibleAnimation();

  return (
    <motion.div {...animateProps} variants={fadeIn} initial="hidden" animate="visible">
      Content
    </motion.div>
  );
}
```

## Ejemplos Completos

### Lista Animada con Stagger

```tsx
"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem, springTransition } from "@/lib/animations";

export function AnimatedList({ items }: { items: string[] }) {
  return (
    <motion.ul
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      transition={springTransition}
      className="space-y-2"
    >
      {items.map((item, index) => (
        <motion.li key={index} variants={staggerItem} className="rounded-lg bg-white p-4 shadow">
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### Card Interactivo

```tsx
"use client";

import { motion } from "framer-motion";
import { cardHover } from "@/lib/animations";

export function InteractiveCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={cardHover}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      className="cursor-pointer rounded-lg bg-white p-6"
    >
      {children}
    </motion.div>
  );
}
```

### Modal con AnimatePresence

```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { modalOverlay, modalContent, modalTransition } from "@/lib/animations";

export function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={modalTransition}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-lg bg-white p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### Scroll Animation

```tsx
"use client";

import { motion } from "framer-motion";
import { useScrollAnimation, slideUp, springTransition } from "@/lib/animations";

export function ScrollReveal({ children }: { children: React.ReactNode }) {
  const { ref, inView } = useScrollAnimation();

  return (
    <motion.div
      ref={ref}
      variants={slideUp}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={springTransition}
    >
      {children}
    </motion.div>
  );
}
```

## Best Practices

1. **Siempre usa `'use client'`** en componentes con animaciones
2. **Respeta prefers-reduced-motion** usando los hooks proporcionados
3. **Usa `AnimatePresence`** para animaciones de salida
4. **No animes layout shifts** que puedan afectar CLS
5. **Mantén las animaciones sutiles** para mejor UX
6. **Combina variants y transitions** para consistencia
7. **Usa stagger** para listas y grids

## Performance

- Las animaciones usan GPU acceleration automáticamente
- `transform` y `opacity` son las propiedades más performantes
- Evita animar `width`, `height` o `top/left`
- Usa `layout` prop solo cuando sea necesario

## Recursos

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Best Practices](https://web.dev/animations/)
- [Reduced Motion Guide](https://web.dev/prefers-reduced-motion/)
