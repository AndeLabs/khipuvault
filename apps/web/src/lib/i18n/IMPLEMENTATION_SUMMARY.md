# Fase 23: Sistema de Internacionalización (i18n) - Completado

## Resumen de Implementación

Se ha implementado un sistema completo de internacionalización (i18n) para KhipuVault sin dependencias externas, utilizando React Context.

## Archivos Creados

### 1. `/lib/i18n/config.ts`

Configuración central del sistema i18n:

- `SUPPORTED_LOCALES`: ['es', 'en']
- `DEFAULT_LOCALE`: 'es'
- `getLocale()`: Detecta idioma del navegador
- `formatNumber()`: Formatea números según locale
- `formatCurrency()`: Formatea moneda según locale
- `formatDate()`: Formatea fechas según locale
- `formatRelativeTime()`: Formatea tiempo relativo (ej: "hace 2 días")
- `formatPercentage()`: Formatea porcentajes

### 2. `/lib/i18n/messages/es.ts`

Traducciones en español (idioma por defecto):

- `common`: Acciones comunes (conectar, desconectar, aprobar, etc.)
- `wallet`: Billetera y balance
- `pool`: Operaciones de pools (depositar, retirar, claim)
- `rosca`: Pools rotativos (ROSCA)
- `lottery`: Lotería/Prize pool
- `mezo`: Integración con Mezo
- `forms`: Validación de formularios
- `errors`: Mensajes de error
- `transaction`: Estados de transacción
- `stats`: Estadísticas y analíticas
- `nav`: Navegación
- `time`: Unidades de tiempo

Total: ~220 traducciones organizadas por categorías

### 3. `/lib/i18n/messages/en.ts`

Traducciones en inglés:

- Misma estructura que `es.ts`
- Type-safe: debe cumplir con `TranslationKeys`
- Todas las claves traducidas

### 4. `/lib/i18n/hooks.ts`

React hooks para acceder a traducciones:

- `I18nProvider`: Context provider para envolver la app
- `useTranslation()`: Hook completo (t, locale, setLocale)
- `useLocale()`: Hook solo lectura (locale)
- `useT()`: Hook simplificado (t)

Características:

- Detección automática de idioma del navegador
- Persistencia en localStorage
- SSR-safe (previene hydration mismatches)
- Type-safe translation function

### 5. `/lib/i18n/index.ts`

Entry point que re-exporta todo:

- Configuración
- Mensajes
- Hooks
- Types

### 6. `/lib/i18n/README.md`

Documentación completa:

- Guía de instalación
- Ejemplos de uso
- Utilidades de formato
- Mejores prácticas
- Ejemplos completos

### 7. `/lib/i18n/example-usage.tsx`

Componentes de ejemplo:

- `LanguageSwitcher`: Selector de idioma
- `BasicTranslationExample`: Traducciones básicas
- `NumberFormattingExample`: Formateo de números
- `DateFormattingExample`: Formateo de fechas
- `PoolActionsExample`: Acciones de pool traducidas
- `ErrorMessagesExample`: Mensajes de error
- `I18nDemoPage`: Página demo completa

## Uso Rápido

### 1. Configurar Provider (en layout.tsx)

```tsx
import { I18nProvider } from "@/lib/i18n";

export default function RootLayout({ children }) {
  return <I18nProvider>{children}</I18nProvider>;
}
```

### 2. Usar en Componentes

```tsx
import { useT } from "@/lib/i18n";

export function MyComponent() {
  const { t } = useT();

  return <button>{t("common.connect")}</button>;
}
```

### 3. Formatear Valores

```tsx
import { formatCurrency, useLocale } from "@/lib/i18n";

const locale = useLocale();
const price = formatCurrency(99.99, locale, "USD");
```

## Características Principales

### Type Safety

- TypeScript garantiza que `en.ts` tenga las mismas claves que `es.ts`
- Autocomplete en el IDE para claves de traducción
- Errores de compilación si faltan traducciones

### SSR Compatible

- Funciona con Next.js App Router
- Previene hydration mismatches
- Detecta idioma solo en el cliente

### Sin Dependencias

- No requiere `next-intl`, `react-i18next`, ni otras librerías
- Solución ligera basada en React Context
- Intl API nativa del navegador para formateo

### Extensible

- Fácil agregar nuevos idiomas
- Estructura organizada por features
- Funciones de formateo reutilizables

## Verificación

### Compilación TypeScript

```bash
pnpm tsc -p apps/web/tsconfig.json --noEmit
```

Resultado: Sin errores relacionados con i18n

### Estructura de Archivos

```
apps/web/src/lib/i18n/
├── config.ts                    (3.1 KB)
├── hooks.ts                     (3.2 KB)
├── index.ts                     (545 B)
├── messages/
│   ├── es.ts                    (8.2 KB)
│   └── en.ts                    (7.8 KB)
├── README.md                    (5.8 KB)
├── example-usage.tsx            (6.8 KB)
└── IMPLEMENTATION_SUMMARY.md    (Este archivo)
```

## Próximos Pasos Sugeridos

1. **Integrar en app/layout.tsx**:
   - Envolver children con `<I18nProvider>`

2. **Agregar Language Switcher**:
   - Usar componente `LanguageSwitcher` de example-usage.tsx
   - Colocar en header o settings

3. **Migrar componentes existentes**:
   - Reemplazar strings hardcoded con `t('key')`
   - Empezar con componentes principales (DepositCard, WithdrawCard)

4. **Agregar traducciones faltantes**:
   - Revisar componentes para strings no traducidos
   - Agregar a es.ts y en.ts según necesidad

5. **Testing**:
   - Probar cambio de idioma en runtime
   - Verificar formateo de números/fechas
   - Probar detección automática de idioma

## Beneficios

- Soporte multi-idioma listo para producción
- Mejor UX para usuarios internacionales
- Code organization mejorado (strings centralizados)
- Fácil mantenimiento y actualización de textos
- Type safety previene errores de traducción

## Notas Técnicas

- El sistema usa `Intl.NumberFormat`, `Intl.DateTimeFormat`, y `Intl.RelativeTimeFormat`
- Las traducciones se cargan sincrónicamente (no hay code splitting por idioma)
- El locale se detecta de `navigator.language` y se guarda en `localStorage`
- El Provider usa `createElement` en vez de JSX para evitar problemas de compilación
- SSR: renderiza con DEFAULT_LOCALE, client hydration aplica locale detectado

## Referencias

- Configuración: `/apps/web/src/lib/i18n/config.ts`
- Mensajes ES: `/apps/web/src/lib/i18n/messages/es.ts`
- Mensajes EN: `/apps/web/src/lib/i18n/messages/en.ts`
- Hooks: `/apps/web/src/lib/i18n/hooks.ts`
- Documentación: `/apps/web/src/lib/i18n/README.md`
- Ejemplos: `/apps/web/src/lib/i18n/example-usage.tsx`
