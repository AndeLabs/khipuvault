# KhipuVault Documentation

> Comprehensive documentation site powered by Fumadocs

Built with ❤️ using [Fumadocs](https://fumadocs.dev/) - The best documentation framework for Next.js.

## 🚀 Quick Start

```bash
# Development
pnpm dev:docs

# Build for production
pnpm build:docs

# Start production server
pnpm --filter @khipu/docs start
```

The docs will be available at **http://localhost:3002**

## 📚 What's Inside

This documentation site covers all aspects of KhipuVault:

### 📖 Content Sections

- **Getting Started** - Quick onboarding guides
- **Products** - Deep dives for each savings product
  - Individual Savings
  - Community Pools
  - Rotating Pool (ROSCA)
  - Prize Pool (Lottery)
- **Concepts** - Educational content about Bitcoin DeFi
- **Tutorials** - Step-by-step guides with screenshots
- **Developers** - Integration guides and API documentation
- **Security** - Audits, best practices, bug bounty
- **Resources** - FAQ, glossary, troubleshooting

### 🌍 Bilingual Support

Documentation is available in:

- 🇺🇸 **English** (`/docs/`)
- 🇪🇸 **Español** (`/docs/es/`)

Perfect for our ROSCA/Pasanaku communities!

## 🎨 Technology Stack

- **Framework:** [Next.js 16](https://nextjs.org/) with App Router
- **Docs:** [Fumadocs](https://fumadocs.dev/)
- **Content:** MDX (Markdown + React components)
- **Styling:** Tailwind CSS v4
- **Search:** Orama (local, fast, privacy-friendly)
- **Deployment:** Vercel

## 📝 Writing Documentation

### File Structure

```
content/
├── docs/           # English content
│   ├── index.mdx
│   ├── getting-started/
│   ├── products/
│   ├── concepts/
│   ├── tutorials/
│   ├── developers/
│   ├── security/
│   └── resources/
└── es/             # Spanish content
    ├── index.mdx
    └── ... (same structure)
```

### Creating a New Page

1. Create a new `.mdx` file in `content/docs/`
2. Add frontmatter:

```mdx
---
title: Your Page Title
description: Brief description for SEO
---

# Your Page Title

Content goes here...
```

3. The page will automatically appear in navigation

### Using MDX Components

Fumadocs provides many built-in components:

```mdx
<Card title="Quick Link" href="/docs/guide">
  Description text
</Card>

<Cards>
  <Card title="Card 1" href="/link1" />
  <Card title="Card 2" href="/link2" />
</Cards>

<Callout type="info">This is an info callout</Callout>

<Steps>
### Step 1
Do this first

### Step 2

Then do this

</Steps>
```

See all components in [Fumadocs UI Docs](https://fumadocs.dev/docs/ui).

## 🎨 Theming

The docs use KhipuVault's design system:

### Colors

- **Primary:** Lavanda (`#BFA4FF`)
- **Accent:** Orange (`#FFC77D`)
- **Success:** Green (`#10B981`)
- **Background:** Dark (`#0A0A0F`)

All colors are defined in `app/global.css` using CSS variables.

## 🔍 Search

The documentation includes full-text search powered by Orama:

- **Fast:** Instant search results
- **Local:** No external API calls
- **Privacy-friendly:** All indexing happens client-side
- **Keyboard shortcut:** `Ctrl+K` / `Cmd+K`

## 🌐 i18n Configuration

Bilingual support is configured in:

- `source.config.ts` - Content i18n settings
- `lib/source.ts` - Loader i18n settings

## 📦 Project Structure

```
apps/docs/
├── app/                    # Next.js App Router
│   ├── (home)/            # Homepage
│   ├── docs/              # Documentation pages
│   ├── api/               # API routes (search)
│   ├── global.css         # Global styles
│   └── layout.tsx         # Root layout
├── components/            # React components
│   └── ai/               # AI-powered features
├── content/              # MDX content
│   └── docs/            # Documentation content
├── lib/                  # Utilities
│   ├── source.ts        # Content loader
│   └── layout.shared.tsx # Shared layout config
├── source.config.ts     # Fumadocs configuration
├── next.config.mjs      # Next.js configuration
└── package.json         # Dependencies
```

## 🚀 Deployment

The docs will be deployed at `docs.khipuvault.com` (Vercel).

## 📚 Learn More

- [Fumadocs Documentation](https://fumadocs.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [MDX Documentation](https://mdxjs.com)

---

**Built with Fumadocs** by the KhipuVault Team
