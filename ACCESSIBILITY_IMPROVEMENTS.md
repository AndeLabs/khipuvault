# Accessibility Improvements - Frontend

## Summary

Mejoras implementadas para resolver los problemas de accesibilidad identificados en el review de la aplicacion web.

## Problemas Resueltos

### 1. Missing DialogTitle in Mobile Menu (Issue #2 from WEB_REVIEW)

**Archivo**: `/apps/web/src/components/layout/header.tsx`

**Problema**: El menu movil (Sheet/Dialog) no tenia DialogTitle, afectando la accesibilidad para screen readers.

**Solucion**:

- Agregado `@radix-ui/react-visually-hidden` como dependencia
- Implementado `<VisuallyHidden.Root>` con `<SheetTitle>` en el SheetContent
- El titulo "Navigation Menu" ahora es accesible para screen readers pero no visible en UI

```tsx
<VisuallyHidden.Root>
  <SheetTitle>Navigation Menu</SheetTitle>
</VisuallyHidden.Root>
```

### 2. Missing aria-labels in Icon-only Buttons

Botones con solo iconos sin descripcion accesible han sido actualizados:

#### a) Mobile Menu Toggle (Header)

**Archivo**: `/apps/web/src/components/layout/header.tsx`

```tsx
<Button variant="ghost" size="icon" aria-label="Open navigation menu">
  <Menu className="h-6 w-6" />
  <span className="sr-only">Open menu</span>
</Button>
```

#### b) Dashboard Mobile Menu Toggle

**Archivo**: `/apps/web/src/components/layout/dashboard-header.tsx`

```tsx
<Button
  size="icon"
  variant="ghost"
  className="md:hidden"
  onClick={onMenuClick}
  aria-label="Toggle navigation menu"
>
  <Menu className="h-5 w-5" />
  <span className="sr-only">Toggle Menu</span>
</Button>
```

#### c) Contract Address Copy Button

**Archivo**: `/apps/web/src/components/dashboard/contracts-info.tsx`

```tsx
<Button
  variant="ghost"
  size="sm"
  className="h-6 w-6 p-0"
  onClick={copyToClipboard}
  title={copied ? "¡Copiado!" : "Copiar dirección"}
  aria-label={copied ? "Address copied" : "Copy contract address"}
>
  {copied ? (
    <Check className="h-3 w-3 text-green-500" />
  ) : (
    <Copy className="h-3 w-3" />
  )}
  <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
</Button>
```

#### d) Block Explorer Link

**Archivo**: `/apps/web/src/components/dashboard/contracts-info.tsx`

```tsx
<a
  href={contract.explorerUrl}
  target="_blank"
  rel="noopener noreferrer"
  title="Ver en explorador"
  aria-label="View contract in block explorer"
>
  <ExternalLink className="h-3 w-3" />
  <span className="sr-only">View in explorer</span>
</a>
```

#### e) Pool Settings Button

**Archivo**: `/apps/web/src/components/dashboard/cooperative-savings/my-pools.tsx`

```tsx
<Button variant="ghost" size="icon" aria-label="Pool settings">
  <Settings className="h-5 w-5" />
  <span className="sr-only">Settings</span>
</Button>
```

#### f) Logout Button (Privy)

**Archivo**: `/apps/web/src/components/wallet/privy-connect-button.tsx`

```tsx
<Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
  <LogOut className="h-4 w-4" />
  <span className="sr-only">Logout</span>
</Button>
```

#### g) Sidebar Toggle

**Archivo**: `/apps/web/src/components/ui/sidebar.tsx`

```tsx
<Button
  ref={ref}
  data-sidebar="trigger"
  variant="ghost"
  size="icon"
  className={cn("h-7 w-7", className)}
  onClick={(event) => {
    onClick?.(event);
    toggleSidebar();
  }}
  aria-label="Toggle sidebar"
  {...props}
>
  <PanelLeft />
  <span className="sr-only">Toggle Sidebar</span>
</Button>
```

### 3. Collapsible Menu Accessibility

**Archivo**: `/apps/web/src/components/layout/sidebar.tsx`

**Mejora**: Agregado aria-label dinamico al boton de Settings collapsible y aria-hidden al icono decorativo.

```tsx
<Button
  variant="ghost"
  className={cn(
    "w-full justify-between",
    isActive && "bg-surface-elevated text-lavanda",
  )}
  aria-label={`${isExpanded || isActive ? "Collapse" : "Expand"} ${item.title} menu`}
>
  <div className="flex items-center gap-3">
    <Icon className="h-5 w-5" />
    <span className="font-medium">{item.title}</span>
  </div>
  <ChevronDown
    className={cn(
      "h-4 w-4 transition-transform duration-fast",
      (isExpanded || isActive) && "rotate-180",
    )}
    aria-hidden="true"
  />
</Button>
```

## Dependencias Agregadas

```json
{
  "@radix-ui/react-visually-hidden": "^1.2.4"
}
```

## Patrones de Accesibilidad Implementados

### 1. Botones con Solo Iconos

Todos los botones icon-only ahora incluyen:

- `aria-label`: Descripcion clara de la accion
- `<span className="sr-only">`: Texto alternativo para screen readers
- `title`: Tooltip visual (cuando aplica)

### 2. Dialogos y Modales

- Todos los Dialog/Sheet ahora tienen `DialogTitle` o `SheetTitle`
- Titulos no visibles usan `@radix-ui/react-visually-hidden`

### 3. Iconos Decorativos

- Iconos puramente decorativos (como ChevronDown) tienen `aria-hidden="true"`

### 4. Estados Dinamicos

- Los aria-labels se actualizan segun el estado (ej: "Copied" vs "Copy")
- Los collapsibles indican su estado actual ("Expand" vs "Collapse")

## Testing de Accesibilidad

Para verificar las mejoras:

1. **Screen Reader Testing**:
   - VoiceOver (macOS): `Cmd + F5`
   - NVDA (Windows)
   - JAWS (Windows)

2. **Keyboard Navigation**:
   - Tab: navegar entre elementos interactivos
   - Enter/Space: activar botones
   - Escape: cerrar modales

3. **Browser DevTools**:
   - Chrome: Lighthouse Accessibility Audit
   - Firefox: Accessibility Inspector
   - axe DevTools extension

## Archivos Modificados

1. `/apps/web/src/components/layout/header.tsx`
2. `/apps/web/src/components/layout/dashboard-header.tsx`
3. `/apps/web/src/components/layout/sidebar.tsx`
4. `/apps/web/src/components/dashboard/contracts-info.tsx`
5. `/apps/web/src/components/dashboard/cooperative-savings/my-pools.tsx`
6. `/apps/web/src/components/wallet/privy-connect-button.tsx`
7. `/apps/web/src/components/ui/sidebar.tsx`
8. `/apps/web/package.json` (nueva dependencia)

## Cumplimiento de Estandares

Las mejoras implementadas cumplen con:

- **WCAG 2.1 Level AA**:
  - 1.1.1 Non-text Content
  - 2.1.1 Keyboard
  - 2.4.4 Link Purpose (In Context)
  - 4.1.2 Name, Role, Value

- **WAI-ARIA 1.2**:
  - Proper use of `aria-label`
  - Proper use of `aria-hidden`
  - Proper use of semantic roles

## Referencias

- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Fecha**: 2025-12-26
**Autor**: Claude Opus 4.5
**Status**: Completado
