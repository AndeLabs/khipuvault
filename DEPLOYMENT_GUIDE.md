# 🚀 KhipuVault Deployment Guide

> Guía completa para desplegar web y docs en Vercel con dominio khipuvault.com

**Fecha:** 2026-02-08
**Dominio comprado:** khipuvault.com (Spaceship)
**Hosting:** Vercel

---

## 📋 Checklist de Deployment

- [x] Dominio comprado (khipuvault.com en Spaceship)
- [ ] Docs desplegado en Vercel
- [ ] Web desplegado en Vercel
- [ ] DNS configurado en Spaceship
- [ ] Dominio personalizado configurado en Vercel
- [ ] URLs actualizadas en código
- [ ] SSL/HTTPS activo

---

## 🎯 Estructura de URLs Final

```
Producción:
├─ khipuvault.com                 → Web App (apps/web)
├─ www.khipuvault.com             → Redirect a khipuvault.com
└─ docs.khipuvault.com            → Documentation (apps/docs)

Desarrollo:
├─ localhost:9002                 → Web App
└─ localhost:3002                 → Docs
```

---

## 📦 PASO 1: Desplegar Apps a Vercel

### Opción A: GitHub + Vercel (Recomendado - Auto Deploy)

#### 1.1 Preparar Repositorio

```bash
# Asegurarse que todo está commiteado
git status
git add .
git commit -m "feat: prepare for production deployment"
git push origin main
```

#### 1.2 Crear Proyecto en Vercel (Docs)

1. Ir a https://vercel.com/dashboard
2. Click "Add New Project"
3. Importar repositorio de GitHub
4. Configurar:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/docs`
   - **Build Command:** `cd ../.. && pnpm build --filter=@khipu/docs`
   - **Output Directory:** `.next`
   - **Install Command:** `pnpm install`

5. Environment Variables (ninguna necesaria por ahora)

6. Click "Deploy"

**URL temporal:** Se asignará algo como `khipuvault-docs-xxx.vercel.app`

#### 1.3 Crear Proyecto en Vercel (Web)

Repetir proceso para web app:

1. "Add New Project"
2. Mismo repositorio
3. Configurar:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `cd ../.. && pnpm build --filter=@khipu/web`
   - **Output Directory:** `.next`
   - **Install Command:** `pnpm install`

4. Environment Variables:

   ```
   NEXT_PUBLIC_DOCS_URL=https://docs.khipuvault.com
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<tu-project-id>
   NEXT_PUBLIC_RPC_URL=https://rpc.test.mezo.org
   ```

5. Click "Deploy"

**URL temporal:** Se asignará algo como `khipuvault-web-xxx.vercel.app`

---

### Opción B: Vercel CLI (Deploy Manual)

```bash
# Instalar Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Deploy docs
cd apps/docs
vercel --prod

# Deploy web
cd ../web
vercel --prod
```

---

## 🌐 PASO 2: Configurar DNS en Spaceship

Una vez que tengas los proyectos en Vercel, configura el DNS:

### 2.1 Obtener Records de Vercel

En cada proyecto de Vercel:

1. Settings → Domains
2. Add Domain
3. Vercel te dará los DNS records necesarios

### 2.2 Configurar en Spaceship

1. Login en https://www.spaceship.com
2. Dashboard → Domains → khipuvault.com
3. DNS Management
4. Agregar estos records:

**Para el dominio principal (khipuvault.com → web app):**

```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto
```

**Para docs (docs.khipuvault.com → docs app):**

```
Type: CNAME
Name: docs
Value: cname.vercel-dns.com
TTL: Auto
```

**Para www redirect:**

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

---

## 🔧 PASO 3: Configurar Dominios en Vercel

### 3.1 Configurar Web App

1. Proyecto web en Vercel → Settings → Domains
2. Add Domain: `khipuvault.com`
3. Add Domain: `www.khipuvault.com` (redirect to main)
4. Vercel verificará automáticamente

### 3.2 Configurar Docs

1. Proyecto docs en Vercel → Settings → Domains
2. Add Domain: `docs.khipuvault.com`
3. Vercel verificará automáticamente

**Tiempo de propagación DNS:** 5 minutos a 48 horas (usualmente ~15 minutos)

---

## 📝 PASO 4: Actualizar URLs en Código

### 4.1 Web App Header

**Archivo:** `apps/web/src/components/layout/header.tsx`

**Cambiar:**

```typescript
// Línea 38
href = "http://localhost:3002";

// POR:
href = "https://docs.khipuvault.com";
```

**O mejor, usar variable de entorno:**

```typescript
const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL || 'http://localhost:3002';

<Link href={DOCS_URL} ...>
```

### 4.2 Environment Variables

**Archivo:** `apps/web/.env.local`

```bash
NEXT_PUBLIC_DOCS_URL=https://docs.khipuvault.com
```

**Vercel Dashboard:**

- Settings → Environment Variables
- Add: `NEXT_PUBLIC_DOCS_URL` = `https://docs.khipuvault.com`
- Para: Production, Preview, Development

### 4.3 Docs - Link a App

**Archivo:** `apps/docs/lib/layout.shared.tsx`

**Línea 13:**

```typescript
{ text: "Main App", url: "https://khipuvault.com", external: true },
```

Ya está correcto ✅

---

## ✅ PASO 5: Verificación Post-Deployment

### 5.1 Checklist de Pruebas

```bash
# Test SSL
https://khipuvault.com         # ✅ Debe cargar con candado verde
https://docs.khipuvault.com    # ✅ Debe cargar con candado verde
https://www.khipuvault.com     # ✅ Debe redirect a khipuvault.com

# Test navegación
1. Abrir https://khipuvault.com
2. Click en "Docs" en header
3. Debe abrir https://docs.khipuvault.com en nueva pestaña ✅

# Test desde docs
1. Abrir https://docs.khipuvault.com
2. Click en "Main App" en header
3. Debe abrir https://khipuvault.com ✅

# Test mobile
1. Abrir en móvil https://khipuvault.com
2. Abrir menú hamburguesa
3. Click "Documentation"
4. Debe abrir https://docs.khipuvault.com ✅
```

### 5.2 Verificar SSL

```bash
# Comprobar certificado SSL
curl -I https://khipuvault.com
# Debe mostrar: HTTP/2 200

# SSL Labs Test
https://www.ssllabs.com/ssltest/analyze.html?d=khipuvault.com
# Objetivo: A+ rating
```

---

## 🔄 PASO 6: Redeploy con URLs Actualizadas

Después de actualizar el código:

```bash
git add .
git commit -m "feat: update production URLs"
git push origin main
```

Vercel auto-deployará ambas apps con las nuevas URLs.

---

## 🌍 Configuración de Environment Variables

### Apps/Web (.env.local y Vercel)

```bash
# Blockchain
NEXT_PUBLIC_RPC_URL=https://rpc.test.mezo.org
NEXT_PUBLIC_CHAIN_ID=31611

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# URLs
NEXT_PUBLIC_DOCS_URL=https://docs.khipuvault.com
NEXT_PUBLIC_API_URL=https://api.khipuvault.com  # Futuro

# Features
NEXT_PUBLIC_ENABLE_TESTNET=true
```

### Apps/Docs (Vercel)

```bash
# No se necesitan variables especiales
# Fumadocs funciona out-of-the-box
```

---

## 🐛 Troubleshooting

### DNS no propaga

```bash
# Verificar DNS
dig khipuvault.com
dig docs.khipuvault.com

# Flush DNS local
# Mac:
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Windows:
ipconfig /flushdns
```

### Build falla en Vercel

**Error común:** `pnpm: command not found`

**Solución:**

- Vercel Settings → General → Build & Development Settings
- Package Manager: `pnpm`

**Error:** `Module not found: Can't resolve '@khipu/...'`

**Solución:**

- Asegurar que el build command incluya workspace root:
  ```bash
  cd ../.. && pnpm build --filter=@khipu/web
  ```

### SSL no activa

- Esperar 5-15 minutos después de configurar DNS
- Vercel genera certificado automáticamente
- Verificar en Settings → Domains que aparezca "Valid Configuration"

---

## 📊 Monitoreo Post-Deploy

### Vercel Analytics

1. Proyecto → Analytics
2. Revisar:
   - Page views
   - Load times
   - Error rates

### Uptime Monitoring

Servicios gratuitos:

- https://uptimerobot.com (50 monitores gratis)
- https://www.freshping.io (50 checks gratis)

Configurar:

- Monitor: `https://khipuvault.com`
- Monitor: `https://docs.khipuvault.com`
- Interval: 5 minutos
- Alerta: Email cuando caiga

---

## 🎯 Resultado Final

```
✅ https://khipuvault.com
   ├─ SSL activo
   ├─ Link a docs en header
   └─ Mobile responsive

✅ https://docs.khipuvault.com
   ├─ SSL activo
   ├─ 86 páginas indexadas
   ├─ Search funcionando
   └─ Link a main app

✅ Navegación funcionando
   ├─ Web → Docs ✓
   └─ Docs → Web ✓
```

---

## 📞 Comandos Útiles

```bash
# Ver logs de deployment
vercel logs <deployment-url>

# Rollback a deployment anterior
vercel rollback <deployment-url>

# Ver todos los deployments
vercel list

# Configurar alias de dominio
vercel alias <deployment-url> khipuvault.com

# Test local con HTTPS
vercel dev --listen 3000
```

---

## 🔐 Seguridad

### Headers de Seguridad

Vercel los configura automáticamente:

- ✅ HTTPS/TLS 1.3
- ✅ HSTS
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options

### WHOIS Privacy

Ya activada en Spaceship ✅

### 2FA en Vercel

1. Account Settings → Security
2. Enable Two-Factor Authentication

---

## 💰 Costos Mensuales Estimados

```
Dominio (Spaceship):
├─ Año 1: $2.90 ($0.24/mes)
└─ Renovación: $10.18/año ($0.85/mes)

Vercel:
├─ Hobby Plan: $0/mes
└─ Pro Plan: $20/mes (si necesitas más)

Total mensual: ~$0.24 (primer año) o ~$0.85 (renovaciones)
```

---

**Última actualización:** 2026-02-08
**Estado:** Listo para deployment
