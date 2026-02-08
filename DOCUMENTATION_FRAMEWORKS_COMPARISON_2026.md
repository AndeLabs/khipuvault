# Comparación de Frameworks de Documentación 2026

> Investigación completa de los mejores frameworks para crear la documentación de KhipuVault

**Fecha:** 2026-02-08
**Investigado por:** KhipuVault Team

---

## 🎯 Resumen Ejecutivo

**Top 3 Recomendaciones para KhipuVault:**

1. 🥇 **Fumadocs** - Mejor opción (Next.js App Router, moderno, gratis)
2. 🥈 **Nextra** - Alternativa sólida (Next.js, más simple, gratis)
3. 🥉 **Starlight** - Si queremos multi-framework (Astro, gratis)

**❌ Descartados:**

- Mintlify ($300/mes - muy caro)
- Docusaurus (React, más pesado, mejor para versioning complejo)
- VitePress (Vue - no encaja con nuestro stack Next.js/React)

---

## 📊 Comparación Completa

### 1. Fumadocs 🥇 **RECOMENDADO**

**Framework:** Next.js App Router (React)
**Costo:** ✅ **100% GRATIS** (Open Source, MIT License)
**Downloads:** N/A (más nuevo)
**GitHub Stars:** ~3.5k+ (creciendo rápido)

#### ✅ Pros

- **Next.js App Router nativo** - Usa las últimas features de Next.js 14/15
- **Super moderno** - Diseñado específicamente para App Router
- **Composable** - Arquitectura Core → Content → UI (máxima flexibilidad)
- **Hermoso por defecto** - UI profesional sin configuración
- **Usado por gigantes** - Shadcn UI, Million.js, Arktype, v0 (Vercel)
- **MDX + TypeScript** - Soporte completo
- **Múltiples content sources** - MDX, Content Collections, CMS
- **Tailwind CSS** - Fácil customización
- **AI-friendly** - Sintaxis extensiva para AI agents
- **Deployment fácil** - Vercel deploy con 1 click

#### ❌ Contras

- **Más nuevo** - Comunidad más pequeña que Nextra/Docusaurus
- **Requiere configuración** - Más flexible = más setup inicial
- **Documentación en inglés** - Menos ejemplos que frameworks maduros

#### 💡 Casos de Uso Perfectos

- ✅ Proyectos Next.js existentes (¡como KhipuVault!)
- ✅ Teams que quieren máxima customización
- ✅ Documentación moderna y hermosa
- ✅ Integración con monorepos turborepo

#### 🔗 Links

- Website: https://www.fumadocs.dev/
- GitHub: https://github.com/fuma-nama/fumadocs
- Demo: https://www.fumadocs.dev/docs

---

### 2. Nextra 🥈 **ALTERNATIVA SÓLIDA**

**Framework:** Next.js Pages Router (React)
**Costo:** ✅ **100% GRATIS** (Open Source, MIT License)
**Downloads:** ~116k/semana
**GitHub Stars:** ~13.2k

#### ✅ Pros

- **Maduro y probado** - Años de uso en producción
- **Simple y rápido** - Setup en minutos
- **Comunidad grande** - Muchos ejemplos y recursos
- **Docs oficiales** - Usado por Nextra mismo, SWR, Turbo
- **MDX support** - Markdown + React components
- **Temas built-in** - Docs theme + Blog theme
- **Search integrado** - FlexSearch por defecto
- **i18n nativo** - Internacionalización built-in

#### ❌ Contras

- **Pages Router** - No usa App Router (tecnología más vieja)
- **Menos flexible** - Más opinado que Fumadocs
- **UI menos moderna** - Diseño funcional pero no tan elegante
- **Customización limitada** - Harder to override defaults

#### 💡 Casos de Uso Perfectos

- ✅ Quieres algo rápido y probado
- ✅ No necesitas App Router features
- ✅ Comunidad grande importa más que modernidad

#### 🔗 Links

- Website: https://nextra.site/
- GitHub: https://github.com/shuding/nextra
- Examples: https://nextra.site/showcase

---

### 3. Starlight (Astro) 🥉 **SI QUIERES MULTI-FRAMEWORK**

**Framework:** Astro (Multi-framework)
**Costo:** ✅ **100% GRATIS** (Open Source, MIT License)
**Downloads:** N/A (parte de Astro)
**GitHub Stars:** ~46k (Astro)

#### ✅ Pros

- **Ultra rápido** - Astro es el más rápido (0 JS por defecto)
- **Multi-framework** - Puedes usar React, Vue, Svelte juntos
- **Features completos** - Search, i18n, dark mode, todo incluido
- **Diseño hermoso** - Tema moderno por defecto
- **SEO excelente** - Optimizado desde el inicio
- **Eco-friendly** - Menor huella de carbono (menos JS)
- **Usado por Mezo** - Ya está probado en el ecosistema

#### ❌ Contras

- **Astro** - Stack diferente a Next.js (curva de aprendizaje)
- **Menos integración** - Con nuestro monorepo Next.js
- **React limitado** - Islands architecture (no todo es interactivo)
- **Separación de proyectos** - Docs separado del main app

#### 💡 Casos de Uso Perfectos

- ✅ Quieres el sitio MÁS rápido posible
- ✅ Estás ok con un stack separado
- ✅ Necesitas máxima performance (SEO crítico)
- ✅ Quieres usar Vue/Svelte para algunas partes

#### 🔗 Links

- Website: https://starlight.astro.build/
- GitHub: https://github.com/withastro/starlight
- Examples: https://starlight.astro.build/showcase/

---

### 4. Docusaurus ⚠️ **NO RECOMENDADO PARA NOSOTROS**

**Framework:** React (Custom)
**Costo:** ✅ **100% GRATIS** (Open Source, MIT License)
**Downloads:** ~560k/semana
**GitHub Stars:** ~62k

#### ✅ Pros

- **Más popular** - Comunidad masiva (Facebook/Meta)
- **Feature-rich** - Versioning, i18n, plugins, todo built-in
- **Probado en producción** - React, Redux, Jest lo usan
- **Muchos plugins** - Ecosystem enorme
- **Docs versioning** - Múltiples versiones side-by-side

#### ❌ Contras

- **Pesado** - Más lento que alternativas modernas
- **No Next.js** - Stack completamente diferente
- **Build times** - Más lentos que Vite/Astro
- **Overpowered** - Demasiadas features que no necesitamos
- **Configuración compleja** - Más difícil de customizar

#### 💡 No lo recomiendo porque

- ❌ No usa Next.js (nuestro stack principal)
- ❌ Más pesado sin beneficios extras
- ❌ Build times más lentos
- ❌ Overkill para nuestras necesidades

---

### 5. Mintlify 💰 **DESCARTADO - MUY CARO**

**Framework:** Hosted Platform (MDX)
**Costo:** ❌ **$300/mes** ($600+ para enterprise)
**Tipo:** Closed source (SaaS)

#### ✅ Pros

- **AI-powered** - AI Agent (Autopilot) para auto-updates
- **Hermoso UI** - Diseño moderno y profesional
- **API Playground** - Interactive API testing
- **Git-based** - Workflow con GitHub
- **Usado por grandes** - 5000+ companies, 20M developers

#### ❌ Contras

- **$300/mes** - Muy caro (vs gratis de open source)
- **Vendor lock-in** - No open source, no self-hosted
- **AI metered** - Cargos adicionales por uso de AI
- **+$20 por editor** - Costo escala con team
- **SSO/White-label** - Solo en plan Custom ($600+/mes)

#### 💡 Por qué lo descarto

- ❌ $300/mes vs $0 (Fumadocs/Nextra/Starlight)
- ❌ No necesitamos AI Autopilot (podemos escribir manualmente)
- ❌ Vendor lock-in (no self-hosted)
- ❌ Overkill para un proyecto open source

---

### 6. VitePress ⚠️ **NO ENCAJA CON NUESTRO STACK**

**Framework:** Vue.js + Vite
**Costo:** ✅ **100% GRATIS** (Open Source, MIT License)
**Downloads:** ~393k/semana
**GitHub Stars:** ~16k

#### ✅ Pros

- **Ultra rápido** - Vite HMR es instantáneo
- **Vue-based** - Si usas Vue, es perfecto
- **Diseño moderno** - Tema hermoso por defecto
- **Search built-in** - Local search incluido

#### ❌ Contras (para nosotros)

- **Vue** - Stack diferente (usamos React/Next.js)
- **No compartir componentes** - No podemos reusar nuestros React components
- **Ecosystem separado** - Tooling diferente

#### 💡 No lo recomiendo porque

- ❌ Usamos React/Next.js, no Vue
- ❌ No podemos reusar componentes de @khipu/ui
- ❌ Stack completamente diferente

---

## 🏆 Decisión Final: FUMADOCS

### Por qué Fumadocs es la mejor opción para KhipuVault:

#### 1. ✅ Stack Alignment

- **Next.js nativo** - Mismo stack que `apps/web`
- **React** - Podemos reusar componentes de `@khipu/ui`
- **Tailwind CSS** - Mismo sistema de diseño
- **TypeScript** - Type-safe docs
- **Turborepo** - Se integra perfecto con nuestro monorepo

#### 2. ✅ Modernidad

- **App Router** - Next.js 14/15 features
- **React Server Components** - Performance
- **Streaming** - Fast page loads
- **Latest tech** - Construido para 2026, no 2020

#### 3. ✅ Flexibilidad

- **Composable** - Core → Content → UI
- **Customizable** - Podemos modificar todo
- **Content sources** - MDX, Content Collections, CMS
- **Extensible** - Fácil agregar features custom

#### 4. ✅ Developer Experience

- **Hot reload** - Instant feedback
- **TypeScript** - Type-safe content
- **Great DX** - Herramientas modernas
- **AI-friendly** - Sintaxis extensiva

#### 5. ✅ Producción Ready

- **Usado por Vercel** - v0 docs usan Fumadocs
- **Shadcn UI** - Documenta sus components con esto
- **Million.js** - Framework popular lo usa
- **Arktype** - TypeScript runtime lo usa

#### 6. ✅ Costo

- **$0/mes** - 100% gratis (vs $300/mes Mintlify)
- **Open source** - No vendor lock-in
- **Self-hosted** - Control total
- **MIT License** - Úsalo como quieras

---

## 📦 Implementación Propuesta

### Estructura del Monorepo

```
KhipuVault/
├── apps/
│   ├── web/              # Main app (Next.js) - EXISTENTE
│   ├── api/              # Backend - EXISTENTE
│   └── docs/             # 🆕 NUEVO - Documentation (Fumadocs)
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── [[...slug]]/page.tsx
│       ├── content/
│       │   └── docs/
│       │       ├── index.mdx
│       │       ├── getting-started/
│       │       ├── products/
│       │       ├── concepts/
│       │       ├── tutorials/
│       │       ├── developers/
│       │       ├── security/
│       │       └── resources/
│       ├── components/
│       │   └── ui/      # Reusar @khipu/ui components
│       ├── public/
│       ├── source.config.ts  # Fumadocs config
│       └── package.json
└── packages/
    ├── ui/               # Shared components - REUSAR EN DOCS
    └── ...
```

### Quick Start

```bash
# 1. Crear proyecto Fumadocs
cd apps/
pnpm create fumadocs-app docs

# 2. Instalar dependencies
cd docs
pnpm install

# 3. Configurar para usar @khipu/ui
pnpm add @khipu/ui

# 4. Configurar Tailwind para usar theme de KhipuVault
# Copiar tailwind.config.ts de apps/web

# 5. Agregar scripts al root package.json
# "docs:dev": "pnpm --filter @khipu/docs dev"
# "docs:build": "pnpm --filter @khipu/docs build"

# 6. Desarrollo
pnpm docs:dev
# → http://localhost:3001
```

### Features Out-of-the-Box

Fumadocs incluye por defecto:

- ✅ **Search** - Full-text search with Orama
- ✅ **Dark mode** - Theme switcher
- ✅ **TOC** - Table of contents sidebar
- ✅ **Breadcrumbs** - Navigation context
- ✅ **Prev/Next** - Page navigation
- ✅ **MDX** - Markdown + React components
- ✅ **Code blocks** - Syntax highlighting + copy button
- ✅ **Tabs** - Code examples in multiple languages
- ✅ **Callouts** - Warning, Info, Tip boxes
- ✅ **File tree** - Show directory structures
- ✅ **Responsive** - Mobile-first design

---

## 🎨 Customización para KhipuVault

### 1. Reusar Componentes UI

```tsx
// apps/docs/components/custom-callout.tsx
import { Badge } from "@khipu/ui/badge";
import { Button } from "@khipu/ui/button";

export function ProductCallout({ product }: { product: string }) {
  return (
    <div className="bg-primary/10 rounded-lg border p-6">
      <Badge variant="primary">{product}</Badge>
      <h3>Try {product} Now</h3>
      <Button asChild>
        <a href="/dashboard">Go to Dashboard</a>
      </Button>
    </div>
  );
}
```

Usar en MDX:

```mdx
# Individual Savings

Lorem ipsum...

<ProductCallout product="Individual Savings" />
```

### 2. Theme Matching

```ts
// apps/docs/tailwind.config.ts
import baseConfig from "@khipu/ui/tailwind.config";

export default {
  ...baseConfig,
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./content/**/*.mdx",
    "../../packages/ui/src/**/*.{ts,tsx}", // Incluir @khipu/ui
  ],
  // Reusar mismo theme
};
```

### 3. Bilingual Setup

```ts
// apps/docs/source.config.ts
import { defineConfig } from "fumadocs-mdx/config";

export default defineConfig({
  i18n: {
    languages: ["en", "es"],
    defaultLanguage: "en",
  },
});
```

Estructura:

```
content/
├── docs/           # English (default)
│   └── index.mdx
└── es/             # Spanish
    └── index.mdx
```

### 4. Custom Components

Podemos crear componentes custom para:

- **YieldCalculator** - Interactive calculators
- **ProductComparison** - Side-by-side comparison
- **VideoEmbed** - Embedded YouTube tutorials
- **TxExplorer** - Link to Mezo explorer
- **ContractAddressCard** - Copy contract addresses
- **InteractiveDiagram** - Flow diagrams

---

## 🚀 Timeline de Implementación

### Week 1: Setup

- [x] Investigar frameworks
- [ ] Setup Fumadocs en `/apps/docs`
- [ ] Configurar Tailwind + @khipu/ui
- [ ] Setup bilingual (EN + ES)
- [ ] Configurar deployment (Vercel)
- [ ] Crear estructura de contenido

### Week 2-3: Content (English)

- [ ] Getting Started (6 páginas)
- [ ] Products (28 páginas)
- [ ] Concepts (8 páginas)
- [ ] Crear custom components (calculators, diagrams)

### Week 4: Advanced Content

- [ ] Tutorials (12 páginas)
- [ ] Developers (15 páginas)
- [ ] Security (6 páginas)

### Week 5: Spanish Translation

- [ ] Traducir todo el contenido a español
- [ ] Review por native speaker
- [ ] Test i18n routing

### Week 6: Launch

- [ ] Deploy a `docs.khipuvault.com`
- [ ] Add link en apps/web header
- [ ] Announce en social media

---

## 💰 Comparación de Costos

| Framework      | Monthly Cost | Hosting     | Features                 |
| -------------- | ------------ | ----------- | ------------------------ |
| **Fumadocs**   | **$0**       | Vercel Free | Todo incluido            |
| **Nextra**     | **$0**       | Vercel Free | Todo incluido            |
| **Starlight**  | **$0**       | Vercel Free | Todo incluido            |
| **Docusaurus** | **$0**       | Vercel Free | Todo incluido            |
| **Mintlify**   | **$300-600** | Hosted      | AI Agent, API Playground |

**Ahorro anual con Fumadocs vs Mintlify:** $3,600 - $7,200 💰

---

## 📚 Referencias

### Fumadocs

- [Nextra, Fumadocs, Docusaurus Comparison](https://medium.com/frontendweb/nextra-fumadocs-docusaurus-or-content-layer-which-tool-to-choose-for-your-documentation-needs-c25548c794bc)
- [How Fumadocs Works](https://www.fumadocs.dev/blog/2024-5-15)
- [Fumadocs GitHub](https://github.com/fuma-nama/fumadocs)

### Comparisons

- [Choosing the Perfect Documentation Site](https://medium.com/@movin_silva/choosing-the-perfect-documentation-site-caf86a9a9e30)
- [Nextra vs Docusaurus](https://edujbarrios.com/blog/Nextra-vs-Docusaurus)
- [Starlight vs Docusaurus](https://blog.logrocket.com/starlight-vs-docusaurus-building-documentation/)

### Mintlify

- [5 Best Mintlify Alternatives](https://documentation.ai/blog/mintlify-alternatives)
- [Mintlify Review 2026](https://ferndesk.com/blog/mintlify-review)
- [Mintlify Pricing](https://www.featurebase.app/blog/mintlify-pricing)

### Alternatives

- [10 Open-Source Documentation Frameworks](https://dev.to/silviaodwyer/10-open-source-documentation-frameworks-to-check-out-331f)
- [npm trends comparison](https://npmtrends.com/@docusaurus/core-vs-docusaurus-vs-nextra-vs-vitepress-vs-vuepress)

---

## ✅ Conclusión

**RECOMENDACIÓN FINAL: Fumadocs**

### Razones:

1. ✅ **Stack perfecto** - Next.js App Router (nuestro stack)
2. ✅ **Gratis** - $0/mes (vs $300/mes Mintlify)
3. ✅ **Moderno** - Tecnología 2026
4. ✅ **Flexible** - Máxima customización
5. ✅ **Probado** - Usado por Vercel, Shadcn UI
6. ✅ **Hermoso** - UI profesional por defecto
7. ✅ **DX excelente** - Developer experience superior
8. ✅ **Reusar código** - @khipu/ui components

### Next Steps:

1. Setup Fumadocs proyecto
2. Configurar theme + bilingual
3. Escribir contenido (iterativo)
4. Deploy a `docs.khipuvault.com`

**¿Empezamos?** 🚀

---

**Generado:** 2026-02-08
**Investigado por:** KhipuVault Team
**Decisión:** Fumadocs ✅
