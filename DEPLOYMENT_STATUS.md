# ✅ KhipuVault Deployment Status

> Configuración completada el 2026-02-08

---

## 🎯 Resumen Ejecutivo

**Dominio:** khipuvault.com (Spaceship - $2.90/año)
**DNS:** Cloudflare (gratis + ultra rápido)
**Hosting:** Vercel (gratis)

**Estado:** 🟡 CASI LISTO - Solo falta cambiar nameservers en Spaceship

---

## ✅ Lo que YA está configurado

### 1. Proyectos Vercel Renombrados

```
✅ khipuvault-web  → khipuvault.com + www.khipuvault.com
✅ khipuvault-docs → docs.khipuvault.com
```

### 2. DNS Configurado en Cloudflare

```
✅ Zone ID: 190a5c7eb417184f1ae3249d7348c351
✅ Nameservers asignados:
   - casey.ns.cloudflare.com
   - rachel.ns.cloudflare.com

✅ Records creados:
   - A      @ (khipuvault.com)     → 76.76.21.21
   - CNAME  www                    → cname.vercel-dns.com
   - CNAME  docs                   → cname.vercel-dns.com
```

### 3. Dominios agregados a Vercel

```
✅ khipuvault.com        → khipuvault-web (verified ✓)
✅ www.khipuvault.com    → redirect a khipuvault.com (verified ✓)
✅ docs.khipuvault.com   → khipuvault-docs (verified ✓)
```

### 4. Código Actualizado

```
✅ apps/web/src/components/layout/header.tsx
   - Desktop link: https://docs.khipuvault.com
   - Mobile menu: https://docs.khipuvault.com
   - Usa variable: process.env.NEXT_PUBLIC_DOCS_URL

✅ Environment Variable en Vercel:
   - NEXT_PUBLIC_DOCS_URL=https://docs.khipuvault.com
```

---

## ⏳ PASO PENDIENTE (CRÍTICO)

### 🔴 Cambiar Nameservers en Spaceship

**TÚ necesitas hacer esto ahora:**

1. **Ir a Spaceship:**
   - https://www.spaceship.com
   - Login → Domains → khipuvault.com

2. **Buscar "Nameservers" o "DNS"**

3. **Cambiar:**

   ```
   DE:  launch1.spaceship.net  ❌
        launch2.spaceship.net  ❌

   A:   casey.ns.cloudflare.com  ✅
        rachel.ns.cloudflare.com ✅
   ```

4. **IMPORTANTE: Desactivar DNSSEC**
   - Si hay una opción "DNSSEC", desactivarla temporalmente
   - La reactivaremos en Cloudflare después

5. **Guardar cambios**

**⏱️ Propagación:** 5 minutos a 48 horas (usualmente ~15-30 minutos)

---

## 📊 Después de cambiar los Nameservers

### Estado esperado después de propagación:

```bash
# Verificar propagación
dig khipuvault.com NS

# Debería mostrar:
# khipuvault.com.  IN  NS  casey.ns.cloudflare.com.
# khipuvault.com.  IN  NS  rachel.ns.cloudflare.com.
```

### Una vez propagado (automático):

1. ✅ **SSL se activa automáticamente**
   - Vercel genera certificados Let's Encrypt
   - https://khipuvault.com (🔒 secure)
   - https://docs.khipuvault.com (🔒 secure)

2. ✅ **Sitios accesibles:**
   - https://khipuvault.com → Web App
   - https://www.khipuvault.com → Redirect a khipuvault.com
   - https://docs.khipuvault.com → Documentación

3. ✅ **Navegación funcionando:**
   - Web → Docs (click en header)
   - Docs → Web (click en "Main App")

---

## 🧪 Checklist de Verificación Post-Propagación

Una vez que cambies los nameservers, espera ~30 minutos y verifica:

### DNS Propagación

```bash
# Verificar nameservers
dig khipuvault.com NS +short
# Esperado: casey.ns.cloudflare.com y rachel.ns.cloudflare.com

# Verificar A record
dig khipuvault.com A +short
# Esperado: 76.76.21.21

# Verificar CNAME docs
dig docs.khipuvault.com CNAME +short
# Esperado: cname.vercel-dns.com
```

### Sitios Web

- [ ] https://khipuvault.com carga correctamente
- [ ] https://www.khipuvault.com redirige a khipuvault.com
- [ ] https://docs.khipuvault.com carga la documentación
- [ ] SSL activo (candado verde) en todos los dominios

### Navegación

- [ ] Click "Docs" en header de web → abre docs.khipuvault.com
- [ ] Click "Main App" en docs → abre khipuvault.com
- [ ] Links funcionan en mobile

### Cloudflare Dashboard

- [ ] Status muestra "Active" (no "Pending")
- [ ] SSL/TLS mode: "Full" o "Full (strict)"

---

## 🔧 Configuración Adicional Recomendada

### En Cloudflare (después de activación):

1. **SSL/TLS Settings:**
   - Mode: Full (strict) ← RECOMENDADO
   - Edge Certificates: On
   - Always Use HTTPS: On

2. **Speed Settings:**
   - Auto Minify: CSS, JS, HTML
   - Brotli: On
   - HTTP/2: On
   - HTTP/3 (QUIC): On

3. **Security:**
   - Security Level: Medium
   - Bot Fight Mode: On (gratis)
   - Email Obfuscation: On

4. **Caching:**
   - Browser Cache TTL: Respect Existing Headers
   - Always Online: On

---

## 📝 Próximos Pasos (Después de Propagación)

### 1. Commit y Push de Cambios

```bash
cd /Users/munay/dev/KhipuVault

git status
git add apps/web/src/components/layout/header.tsx
git add apps/web/.env.local.example
git commit -m "feat: update production URLs to khipuvault.com"
git push origin main
```

Vercel auto-deployará con las nuevas URLs.

### 2. Eliminar Proyecto Duplicado

Hay un proyecto antiguo "khipuvault" que parece no usarse:

```bash
# Opcional: eliminar después de verificar que todo funciona
# Ir a Vercel dashboard → khipuvault project → Settings → Delete
```

### 3. Configurar Monitoreo (Opcional)

**UptimeRobot** (gratis):

- https://uptimerobot.com
- Monitor: khipuvault.com (HTTP)
- Monitor: docs.khipuvault.com (HTTP)
- Interval: 5 minutos
- Alert: Email

---

## 💰 Costos

```
Dominio (Spaceship):
├─ Año 1:      $2.90 ✅ (ya pagado)
└─ Renovación: $10.18/año

DNS (Cloudflare):
└─ Plan Free: $0/mes ✅

Hosting (Vercel):
└─ Hobby: $0/mes ✅

━━━━━━━━━━━━━━━━━━━━━━━━
Total: $0/mes (solo dominio $2.90 primer año)
```

---

## 🎯 URLs Finales

```
Producción:
🌐 https://khipuvault.com           → Web App
📚 https://docs.khipuvault.com      → Documentation
🔄 https://www.khipuvault.com       → Redirect → khipuvault.com

Desarrollo:
🌐 http://localhost:9002             → Web App
📚 http://localhost:3002             → Docs
```

---

## 🚨 Troubleshooting

### "This site can't be reached"

- **Causa:** Nameservers no actualizados o propagación pendiente
- **Solución:** Esperar propagación (hasta 48h, usualmente 30min)

### "NET::ERR_CERT_AUTHORITY_INVALID"

- **Causa:** SSL aún no generado por Vercel
- **Solución:** Esperar 5-10 minutos después de que DNS propague

### Cloudflare muestra "Pending"

- **Causa:** Nameservers aún no cambiados en Spaceship
- **Solución:** Cambiar nameservers en Spaceship

### Vercel muestra "Invalid Configuration"

- **Causa:** DNS no apunta correctamente
- **Solución:** Verificar DNS records en Cloudflare

---

## 📞 Soporte

### Cloudflare

- Dashboard: https://dash.cloudflare.com
- Docs: https://developers.cloudflare.com
- Community: https://community.cloudflare.com

### Vercel

- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

### Spaceship

- Dashboard: https://www.spaceship.com
- Support: Email support@spaceship.com

---

## ✅ Checklist Final

**Antes de cambiar nameservers:**

- [x] Dominio comprado en Spaceship
- [x] Proyectos renombrados en Vercel
- [x] DNS configurado en Cloudflare
- [x] Dominios agregados a Vercel
- [x] Código actualizado con URLs producción
- [x] Environment variables configuradas

**Acción requerida:**

- [ ] **CAMBIAR NAMESERVERS EN SPACESHIP** ← HACER AHORA

**Después de propagación:**

- [ ] Verificar DNS con dig
- [ ] Verificar sitios cargan con HTTPS
- [ ] Verificar navegación funciona
- [ ] Commit y push cambios
- [ ] Configurar monitoreo (opcional)

---

**Última actualización:** 2026-02-08 23:30 UTC
**Estado:** 🟡 Esperando cambio de nameservers en Spaceship
**Siguiente paso:** Cambiar nameservers y esperar propagación

🚀 **¡Casi listo para producción!**
