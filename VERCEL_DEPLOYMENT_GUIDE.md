# Vercel Deployment Guide - Monorepo Configuration

## Problema Resuelto

Después de migrar a monorepo, Vercel no sabía dónde encontrar el frontend porque ahora está en `apps/web/` en lugar de la raíz del proyecto.

## Solución Implementada

Se han creado dos configuraciones de Vercel:
1. **Root `vercel.json`** - Configuración principal del monorepo
2. **`apps/web/vercel.json`** - Configuración específica del proyecto web

## Opción 1: Configuración en Vercel Dashboard (RECOMENDADO)

Esta es la forma más simple y recomendada para monorepos.

### Pasos en Vercel Dashboard

1. **Ve a tu proyecto en Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Settings → General → Root Directory**
   - Click en "Edit"
   - Establecer: `apps/web`
   - Click "Save"

3. **Settings → General → Build & Development Settings**

   **Framework Preset:**
   - Seleccionar: `Next.js`

   **Build Command (Override):**
   ```bash
   cd ../.. && pnpm install && pnpm build:web
   ```

   **Install Command (Override):**
   ```bash
   pnpm install
   ```

   **Output Directory:**
   ```
   .next
   ```

4. **Settings → Environment Variables**

   Asegúrate de tener estas variables:
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=tu_project_id
   NEXT_PUBLIC_ALCHEMY_API_KEY=tu_api_key
   NODE_OPTIONS=--max-old-space-size=4096
   NEXT_TELEMETRY_DISABLED=1
   ```

5. **Redeploy**
   - Ve a "Deployments"
   - Click en "..." en el último deployment
   - Click "Redeploy"

## Opción 2: Usar archivos vercel.json (YA CONFIGURADO)

Si prefieres configuración por código, ya está listo:

### Root `/vercel.json`
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd apps/web && pnpm install && pnpm build",
  "devCommand": "cd apps/web && pnpm dev",
  "installCommand": "pnpm install",
  "framework": null,
  "outputDirectory": "apps/web/.next"
}
```

### `apps/web/vercel.json`
```json
{
  "framework": "nextjs",
  "buildCommand": "cd ../.. && pnpm install && pnpm build:web",
  "installCommand": "cd ../.. && pnpm install",
  "outputDirectory": ".next",
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1",
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  }
}
```

## Opción 3: Usar Vercel CLI para deploy manual

```bash
# Install Vercel CLI si no lo tienes
npm i -g vercel

# Desde la raíz del proyecto
vercel --cwd apps/web

# O para producción
vercel --cwd apps/web --prod
```

## Verificación del Build

Antes de deployar a Vercel, verifica que el build funciona localmente:

```bash
# Desde la raíz del proyecto
pnpm install
pnpm build:web

# Debería compilar sin errores
```

## Estructura del Monorepo

```
KhipuVault/
├── vercel.json                 # Config raíz del monorepo
├── pnpm-workspace.yaml         # Workspace config
├── package.json                # Scripts del monorepo
├── apps/
│   └── web/
│       ├── vercel.json         # Config específica de web
│       ├── package.json        # @khipu/web
│       ├── next.config.ts      # Next.js config
│       └── src/                # Código fuente
└── packages/                   # Packages compartidos
    ├── ui/
    ├── web3/
    └── shared/
```

## Troubleshooting

### Error: "No se encuentra package.json"

**Causa:** Vercel está buscando en la raíz en lugar de `apps/web`

**Solución:**
- Opción 1: Configurar Root Directory en Vercel Dashboard
- Opción 2: Usar `--cwd apps/web` con Vercel CLI

### Error: "Module not found" durante el build

**Causa:** Las dependencias de los packages no se están instalando

**Solución:**
```bash
# El build command debe instalar desde la raíz
cd ../.. && pnpm install && pnpm build:web
```

### Error: "pnpm: command not found"

**Solución:** Agregar en Vercel Dashboard → Settings → Environment Variables:
```
ENABLE_EXPERIMENTAL_COREPACK=1
```

Esto hace que Vercel use pnpm automáticamente.

### Build muy lento o timeout

**Solución:** Agregar estas variables de entorno:
```
NODE_OPTIONS=--max-old-space-size=4096
NEXT_TELEMETRY_DISABLED=1
```

## Scripts Disponibles

Desde la raíz del proyecto:

```bash
# Development
pnpm dev              # Todos los servicios
pnpm dev:web         # Solo frontend

# Build
pnpm build           # Todo el monorepo
pnpm build:web       # Solo web app

# Deploy manual
vercel --cwd apps/web --prod
```

## Variables de Entorno Requeridas

### En Vercel Dashboard

**Production:**
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxxxx
NEXT_PUBLIC_ALCHEMY_API_KEY=xxxxx
NEXT_PUBLIC_CHAIN_ID=31611
NODE_OPTIONS=--max-old-space-size=4096
NEXT_TELEMETRY_DISABLED=1
ENABLE_EXPERIMENTAL_COREPACK=1
```

**Preview:**
```env
# Mismas que production pero con valores de testnet
```

### En archivo `.env.local` (desarrollo)

```env
# Ver apps/web/.env.example para la lista completa
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxxxx
NEXT_PUBLIC_ALCHEMY_API_KEY=xxxxx
```

## Checklist de Deployment

Antes de hacer push a main (que triggerea deployment automático):

- [ ] Build local exitoso: `pnpm build:web`
- [ ] No hay errores de TypeScript: `pnpm typecheck`
- [ ] Variables de entorno configuradas en Vercel
- [ ] Root Directory configurado: `apps/web`
- [ ] Build Command configurado correctamente
- [ ] Todas las dependencias en package.json

## Recomendaciones

1. **Usa la configuración del Dashboard** (Opción 1) - Es más mantenible
2. **Configura Preview Deployments** para branches que no sean main
3. **Usa Environment Variables** en lugar de hardcodear valores
4. **Habilita Vercel Analytics** para monitorear performance
5. **Configura Deployment Protection** para staging/production

## Build Command Explicado

```bash
cd ../.. && pnpm install && pnpm build:web
```

1. `cd ../..` - Va a la raíz del monorepo
2. `pnpm install` - Instala todas las dependencias del workspace
3. `pnpm build:web` - Ejecuta el script del root package.json:
   ```json
   "build:web": "turbo run build --filter=@khipu/web"
   ```

Esto asegura que:
- Se instalen los packages compartidos (`@khipu/ui`, `@khipu/web3`, etc.)
- Turborepo optimice el build con cache
- Se construya solo `apps/web` y sus dependencias

## Alternativa: Multiple Vercel Projects

Si quieres deployar múltiples apps del monorepo:

1. **Crear proyecto separado para cada app:**
   - Proyecto 1: `khipuvault-web` → Root Directory: `apps/web`
   - Proyecto 2: `khipuvault-api` → Root Directory: `apps/api` (si usas Vercel Functions)

2. **Configurar cada uno independientemente**

3. **Ventajas:**
   - Deploys independientes
   - URLs separadas
   - Configuración más simple

## Recursos

- [Vercel Monorepo Guide](https://vercel.com/docs/concepts/monorepos)
- [Turborepo + Vercel](https://turbo.build/repo/docs/handbook/deploying-with-vercel)
- [PNPM Workspaces](https://pnpm.io/workspaces)

---

**Estado:** ✅ Configuración completada
**Recomendación:** Usar Opción 1 (Dashboard) para máxima simplicidad
**Fallback:** Opción 2 (vercel.json) ya está configurado como backup
