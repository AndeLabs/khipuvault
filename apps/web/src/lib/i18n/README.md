# KhipuVault i18n System

Sistema de internacionalización (i18n) para KhipuVault, implementado sin librerías externas usando React Context.

## Estructura

```
lib/i18n/
├── config.ts           # Configuración y utilidades de formato
├── messages/
│   ├── es.ts          # Traducciones en español (default)
│   └── en.ts          # Traducciones en inglés
├── hooks.ts           # React Context y hooks
└── index.ts           # Re-exports
```

## Configuración

### Idiomas Soportados

- `es` - Español (default)
- `en` - English

### Configuración del Provider

Envuelve tu aplicación con `I18nProvider`:

```tsx
// app/layout.tsx
import { I18nProvider } from "@/lib/i18n";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
```

## Uso

### Hook básico: useTranslation

```tsx
"use client";

import { useTranslation } from "@/lib/i18n";

export function MyComponent() {
  const { t, locale, setLocale } = useTranslation();

  return (
    <div>
      <h1>{t("common.connect")}</h1>
      <p>Current locale: {locale}</p>
      <button onClick={() => setLocale("en")}>English</button>
      <button onClick={() => setLocale("es")}>Español</button>
    </div>
  );
}
```

### Hook simplificado: useT

```tsx
import { useT } from "@/lib/i18n";

export function DepositButton() {
  const { t } = useT();

  return <button>{t("pool.deposit")}</button>;
}
```

### Hook de solo lectura: useLocale

```tsx
import { useLocale } from "@/lib/i18n";

export function LocaleDisplay() {
  const locale = useLocale();
  return <span>Locale: {locale}</span>;
}
```

## Utilidades de Formato

### Formatear números

```tsx
import { formatNumber, useLocale } from "@/lib/i18n";

const locale = useLocale();
const formatted = formatNumber(1234.56, locale);
// es: "1.234,56"
// en: "1,234.56"
```

### Formatear moneda

```tsx
import { formatCurrency, useLocale } from "@/lib/i18n";

const locale = useLocale();
const price = formatCurrency(99.99, locale, "USD");
// es: "99,99 US$"
// en: "$99.99"
```

### Formatear fechas

```tsx
import { formatDate, useLocale } from "@/lib/i18n";

const locale = useLocale();
const date = formatDate(new Date(), locale);
// es: "8 de marzo de 2026"
// en: "March 8, 2026"
```

### Formatear tiempo relativo

```tsx
import { formatRelativeTime, useLocale } from "@/lib/i18n";

const locale = useLocale();
const relative = formatRelativeTime(yesterday, locale);
// es: "hace 1 día"
// en: "1 day ago"
```

### Formatear porcentaje

```tsx
import { formatPercentage, useLocale } from "@/lib/i18n";

const locale = useLocale();
const percent = formatPercentage(12.5, locale);
// es: "12,50 %"
// en: "12.50%"
```

## Estructura de Traducciones

Las traducciones están organizadas por categorías:

```typescript
{
  common: { ... },        // Acciones comunes (connect, disconnect, etc.)
  wallet: { ... },        // Wallet-related
  pool: { ... },          // Pool operations
  rosca: { ... },         // Rotating pools
  lottery: { ... },       // Prize pool/lottery
  mezo: { ... },          // Mezo integration
  forms: { ... },         // Form validation
  errors: { ... },        // Error messages
  transaction: { ... },   // Transaction status
  stats: { ... },         // Stats & analytics
  nav: { ... },           // Navigation
  time: { ... },          // Time units
}
```

## Agregar Nuevas Traducciones

1. Edita `messages/es.ts` (fuente de verdad):

```typescript
export const es = {
  // ...
  myFeature: {
    title: "Mi Funcionalidad",
    description: "Descripción aquí",
  },
};
```

2. Edita `messages/en.ts` (debe coincidir con la estructura):

```typescript
export const en: TranslationKeys = {
  // ...
  myFeature: {
    title: "My Feature",
    description: "Description here",
  },
};
```

3. Usa en tu componente:

```tsx
const { t } = useT();
const title = t("myFeature.title");
```

## Detección de Idioma

El sistema detecta automáticamente el idioma del navegador:

1. Al montar, detecta `navigator.language`
2. Si el idioma está soportado, lo usa
3. Si no, usa el idioma por defecto (español)
4. Se persiste en localStorage para futuras visitas

## Type Safety

El sistema usa TypeScript para type safety:

- `es.ts` define `TranslationKeys` type
- `en.ts` debe cumplir con `TranslationKeys`
- Esto garantiza que ambos idiomas tengan las mismas claves

## SSR y Hydration

El sistema está optimizado para Next.js:

- Server-side: usa locale por defecto
- Client-side: detecta y aplica locale del navegador
- Previene hydration mismatches

## Mejores Prácticas

1. **Usa claves descriptivas**: `pool.deposit` en vez de `btn1`
2. **Organiza por feature**: Agrupa traducciones relacionadas
3. **Evita concatenación**: Usa strings completos
4. **Mantén consistencia**: Actualiza todos los idiomas
5. **Type safety**: Aprovecha TypeScript para errores tempranos

## Ejemplo Completo

```tsx
"use client";

import { useTranslation, formatCurrency } from "@/lib/i18n";

export function DepositCard() {
  const { t, locale, setLocale } = useTranslation();
  const [amount, setAmount] = useState(0);

  return (
    <div>
      {/* Language switcher */}
      <select value={locale} onChange={(e) => setLocale(e.target.value)}>
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>

      {/* Translated UI */}
      <h2>{t("pool.deposit")}</h2>
      <p>{t("pool.estimatedApy")}: 12.5%</p>

      <input
        type="number"
        placeholder={t("pool.enterAmount")}
        onChange={(e) => setAmount(e.target.value)}
      />

      <p>{formatCurrency(amount, locale, "USD")}</p>

      <button>{t("common.confirm")}</button>
    </div>
  );
}
```
