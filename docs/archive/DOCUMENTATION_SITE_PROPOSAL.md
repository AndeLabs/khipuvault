# KhipuVault Documentation Site Proposal

> Create a world-class documentation site better than Mezo's

**Date:** 2026-02-08
**Status:** Proposal
**Framework:** Starlight (Astro-based) - Same as Mezo, but better organized

---

## 🎯 Why We Need This

Currently, KhipuVault only has:

- Basic FAQ section in the homepage
- Product guides in the homepage
- No dedicated documentation site

**Problems:**

- Users can't deep-dive into technical details
- No searchable documentation
- No developer guides for integrations
- Hard to maintain and update content
- No internationalization (important for Spanish-speaking ROSCA users)

---

## 🚀 What We'll Build

A comprehensive documentation site at `/docs` (or `docs.khipuvault.com`) that's:

- ✅ **Better organized** than Mezo's docs
- ✅ **More visual** with diagrams, screenshots, and videos
- ✅ **Bilingual** (English + Spanish) for ROSCA communities
- ✅ **Developer-friendly** with code examples and API docs
- ✅ **SEO optimized** for discoverability
- ✅ **Interactive** with embedded demos and calculators

---

## 📚 Proposed Documentation Structure

### 1. **Getting Started** (Quick Onboarding)

```
/docs/getting-started
  ├── introduction.md              # What is KhipuVault?
  ├── quick-start.md               # 5-minute quickstart guide
  ├── connect-wallet.md            # How to connect MetaMask/WalletConnect
  ├── get-musd.md                  # How to get mUSD from Mezo
  ├── add-mezo-network.md          # Add Mezo to wallet (step-by-step)
  └── your-first-deposit.md        # Make your first deposit tutorial
```

### 2. **Products** (Deep Dives for Each Product)

```
/docs/products
  ├── overview.md                  # All 4 products comparison table
  │
  ├── individual-savings/
  │   ├── what-is-it.md           # Concept explanation
  │   ├── how-it-works.md         # Step-by-step with diagrams
  │   ├── deposit.md              # How to deposit
  │   ├── withdraw.md             # How to withdraw
  │   ├── track-yields.md         # How yields are calculated
  │   ├── referrals.md            # Referral rewards system
  │   └── faq.md                  # Product-specific FAQ
  │
  ├── community-pools/
  │   ├── what-is-it.md
  │   ├── create-pool.md          # Create your own pool
  │   ├── join-pool.md            # Join existing pool
  │   ├── manage-pool.md          # Pool management
  │   ├── yield-distribution.md   # How yields are shared
  │   ├── governance.md           # Pool governance
  │   └── faq.md
  │
  ├── rotating-pool/
  │   ├── what-is-rosca.md        # Traditional ROSCA explained
  │   ├── how-it-works.md         # Blockchain ROSCA
  │   ├── create-circle.md        # Form your circle
  │   ├── contribute.md           # How to contribute
  │   ├── receive-payout.md       # Receive your turn
  │   ├── flash-loan-protection.md # Security features
  │   ├── trust-requirements.md   # Why trust matters
  │   └── faq.md
  │
  └── prize-pool/
      ├── what-is-no-loss-lottery.md
      ├── buy-tickets.md          # How to participate
      ├── commit-reveal.md        # Randomness explained
      ├── claim-prizes.md         # How to claim if you win
      ├── gas-optimization.md     # 99% gas savings explained
      ├── round-schedule.md       # Weekly rounds timeline
      └── faq.md
```

### 3. **Concepts** (Educational Content)

```
/docs/concepts
  ├── mezo-protocol.md            # What is Mezo? (deeper than homepage)
  ├── musd-stablecoin.md          # mUSD explained in detail
  ├── bitcoin-defi.md             # Bitcoin DeFi landscape
  ├── yield-generation.md         # How yields work
  ├── smart-contracts.md          # Smart contract basics
  ├── gas-fees.md                 # Understanding gas fees
  ├── security.md                 # Security principles
  └── non-custodial.md            # Self-custody explained
```

### 4. **Tutorials** (Step-by-Step Guides with Screenshots)

```
/docs/tutorials
  ├── beginner/
  │   ├── buy-bitcoin.md          # From fiat to BTC
  │   ├── setup-metamask.md       # Install & configure
  │   ├── bridge-to-mezo.md       # Bridge assets
  │   ├── mint-musd.md            # Mint mUSD on Mezo
  │   └── first-savings.md        # Your first savings
  │
  ├── intermediate/
  │   ├── create-community-pool.md
  │   ├── form-rosca-circle.md
  │   ├── maximize-yields.md
  │   └── multi-wallet-strategy.md
  │
  └── advanced/
      ├── smart-contract-interaction.md
      ├── read-blockchain-data.md
      ├── yield-farming-strategies.md
      └── portfolio-optimization.md
```

### 5. **Developers** (For Integrators)

```
/docs/developers
  ├── overview.md                 # Why integrate KhipuVault
  ├── architecture.md             # System architecture diagram
  │
  ├── smart-contracts/
  │   ├── overview.md
  │   ├── individual-pool.md      # Contract API
  │   ├── cooperative-pool.md
  │   ├── rotating-pool.md
  │   ├── lottery-pool.md
  │   ├── events.md               # All events emitted
  │   └── deployment-addresses.md # Testnet/Mainnet addresses
  │
  ├── integration-guides/
  │   ├── wagmi-hooks.md          # Use our Wagmi hooks
  │   ├── direct-contract-calls.md
  │   ├── listen-to-events.md
  │   └── build-on-top.md
  │
  ├── api-reference/
  │   ├── graphql-api.md          # If we add GraphQL indexer
  │   ├── rest-api.md             # Backend API
  │   └── websocket-api.md        # Real-time updates
  │
  └── examples/
      ├── react-integration.md
      ├── vue-integration.md
      ├── mobile-integration.md
      └── custom-ui.md
```

### 6. **Security** (Transparency & Audits)

```
/docs/security
  ├── overview.md                 # Security philosophy
  ├── audits.md                   # Audit reports (when available)
  ├── smart-contract-security.md  # Security features
  ├── bug-bounty.md               # Bug bounty program
  ├── best-practices.md           # User security tips
  └── incident-response.md        # How we handle incidents
```

### 7. **Resources** (Additional Materials)

```
/docs/resources
  ├── glossary.md                 # DeFi/Bitcoin terms
  ├── faq.md                      # General FAQ (comprehensive)
  ├── troubleshooting.md          # Common issues & solutions
  ├── video-tutorials.md          # Video library
  ├── community.md                # Discord, Twitter, GitHub
  ├── brand-kit.md                # Logos, colors for partners
  └── legal.md                    # Terms, Privacy Policy
```

### 8. **Blog/Changelog** (Updates & News)

```
/docs/blog
  ├── 2026-02-08-lottery-launch.md
  ├── 2026-01-15-rotating-pool-live.md
  └── ...

/docs/changelog
  ├── v3.0.0.md                   # Version history
  ├── v2.5.0.md
  └── ...
```

---

## 🎨 Design Improvements Over Mezo

### Visual Enhancements

1. **Interactive Diagrams**
   - Flow diagrams for each product (how money flows)
   - Animated step-by-step guides
   - Interactive calculators (yield calculators for each product)

2. **Screenshots & Videos**
   - Every tutorial has screenshots
   - Short video demos (< 2 min each)
   - GIFs for key interactions

3. **Code Examples**
   - Syntax highlighting
   - Copy-to-clipboard buttons
   - Live code playgrounds (CodeSandbox embeds)

4. **Dark Mode First**
   - Optimized for dark mode (matches our brand)
   - High contrast for readability

### Content Improvements

1. **Bilingual (English + Spanish)**
   - Full Spanish translation for ROSCA/Pasanaku users
   - Language switcher in header
   - URL structure: `/docs/es/...` for Spanish

2. **Progressive Disclosure**
   - Beginner, Intermediate, Advanced sections
   - "Show technical details" expandable sections
   - TL;DR summaries at the top of long pages

3. **Real Examples**
   - Case studies: "How Maria saved $10k using Community Pools"
   - Real transaction examples on testnet
   - Community success stories

4. **Better Search**
   - Algolia DocSearch (free for open source)
   - Search by product, keyword, or topic
   - Suggested searches

---

## 🛠️ Technical Implementation

### Framework: Starlight (Astro)

**Why Starlight?**

- ✅ Same framework Mezo uses (proven)
- ✅ Built-in features: search, i18n, dark mode, SEO
- ✅ Markdown/MDX support (easy to write)
- ✅ Fast build times (Astro)
- ✅ Can embed React components (reuse our UI library)

**Installation:**

```bash
# Create new Starlight project in /docs directory
pnpm create astro@latest docs -- --template starlight
```

### Project Structure

```
KhipuVault/
├── apps/
│   ├── web/              # Main app (Next.js)
│   ├── api/              # Backend
│   └── docs/             # NEW: Documentation site (Astro/Starlight)
│       ├── src/
│       │   ├── content/
│       │   │   ├── docs/          # All markdown files
│       │   │   └── i18n/          # Translations
│       │   ├── components/        # Custom doc components
│       │   └── styles/            # Custom styling
│       ├── public/
│       │   ├── images/            # Screenshots, diagrams
│       │   └── videos/            # Tutorial videos
│       ├── astro.config.mjs
│       └── package.json
└── ...
```

### Configuration

```js
// apps/docs/astro.config.mjs
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  integrations: [
    starlight({
      title: "KhipuVault Docs",
      logo: {
        src: "./src/assets/logo.svg",
      },
      social: {
        github: "https://github.com/your-org/khipuvault",
        twitter: "https://twitter.com/khipuvault",
        discord: "https://discord.gg/khipuvault",
      },
      // Bilingual support
      locales: {
        root: {
          label: "English",
          lang: "en",
        },
        es: {
          label: "Español",
          lang: "es",
        },
      },
      // Sidebar navigation
      sidebar: [
        {
          label: "Getting Started",
          autogenerate: { directory: "getting-started" },
        },
        {
          label: "Products",
          items: [
            {
              label: "Individual Savings",
              autogenerate: { directory: "products/individual-savings" },
            },
            {
              label: "Community Pools",
              autogenerate: { directory: "products/community-pools" },
            },
            {
              label: "Rotating Pool (ROSCA)",
              autogenerate: { directory: "products/rotating-pool" },
            },
            {
              label: "Prize Pool (Lottery)",
              autogenerate: { directory: "products/prize-pool" },
            },
          ],
        },
        {
          label: "Concepts",
          autogenerate: { directory: "concepts" },
        },
        {
          label: "Tutorials",
          autogenerate: { directory: "tutorials" },
        },
        {
          label: "Developers",
          autogenerate: { directory: "developers" },
        },
        {
          label: "Security",
          autogenerate: { directory: "security" },
        },
        {
          label: "Resources",
          autogenerate: { directory: "resources" },
        },
      ],
      // Custom components
      components: {
        Hero: "./src/components/CustomHero.astro",
      },
      // SEO
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "https://khipuvault.com/og-image.png",
          },
        },
      ],
    }),
  ],
});
```

### Deployment Options

1. **Subdomain:** `docs.khipuvault.com` (recommended)
2. **Subpath:** `khipuvault.com/docs`
3. **Separate domain:** `khipuvault-docs.com`

---

## 📊 Features Comparison

| Feature                | Mezo Docs                | KhipuVault Docs (Proposed)           |
| ---------------------- | ------------------------ | ------------------------------------ |
| Framework              | Starlight (Astro)        | ✅ Starlight (Astro)                 |
| Search                 | ✅ Built-in              | ✅ Algolia DocSearch                 |
| Dark Mode              | ✅ Yes                   | ✅ Optimized for dark                |
| i18n                   | ❌ English only          | ✅ English + Spanish                 |
| Interactive Diagrams   | ❌ Static                | ✅ Interactive (Mermaid, Excalidraw) |
| Video Tutorials        | ❌ None                  | ✅ Embedded videos                   |
| Code Playgrounds       | ❌ None                  | ✅ CodeSandbox embeds                |
| Yield Calculator       | ❌ None                  | ✅ Interactive calculators           |
| Developer API Docs     | ⚠️ Basic                 | ✅ Comprehensive with examples       |
| Case Studies           | ❌ None                  | ✅ Real user stories                 |
| Progressive Disclosure | ❌ Linear                | ✅ Beginner/Intermediate/Advanced    |
| LLM Chat Integration   | ✅ ChatGPT, Claude, etc. | ✅ Same + custom chatbot             |

---

## 🗓️ Implementation Plan

### Phase 1: Foundation (Week 1)

- [x] Research Mezo's documentation structure
- [ ] Set up Starlight project in `/apps/docs`
- [ ] Configure sidebar navigation
- [ ] Set up bilingual support (English + Spanish)
- [ ] Design custom theme matching KhipuVault brand
- [ ] Create reusable components (CalloutBox, VideoEmbed, Calculator)

### Phase 2: Core Content (Week 2-3)

- [ ] Write "Getting Started" section (6 pages)
- [ ] Write "Products" section (28 pages - 7 per product)
- [ ] Write "Concepts" section (8 pages)
- [ ] Create diagrams for each product flow
- [ ] Record 5-minute product demo videos

### Phase 3: Advanced Content (Week 4)

- [ ] Write "Tutorials" section (12 pages)
- [ ] Write "Developers" section (15 pages)
- [ ] Write "Security" section (6 pages)
- [ ] Add interactive calculators (yield calculator, savings projections)

### Phase 4: Resources & Polish (Week 5)

- [ ] Write "Resources" section (7 pages)
- [ ] Translate all content to Spanish
- [ ] Add comprehensive FAQ (50+ questions)
- [ ] Create glossary (100+ terms)
- [ ] SEO optimization

### Phase 5: Launch (Week 6)

- [ ] Set up Algolia DocSearch
- [ ] Configure analytics (Plausible/Fathom)
- [ ] Deploy to production (`docs.khipuvault.com`)
- [ ] Announce launch on social media
- [ ] Add link to docs in main app header

---

## 💡 Unique Features (Better than Mezo)

### 1. **Yield Calculator Widget**

Embed in every product page:

```tsx
<YieldCalculator product="individual-savings" />
```

Users input deposit amount, see projected yields over time.

### 2. **Interactive Product Comparison**

Table where users can filter/compare all 4 products:

- Min deposit
- Lockup period
- Expected APY
- Risk level
- Best for (solo/group/community)

### 3. **Live Contract Data**

Show real-time stats from blockchain:

- Total Value Locked (TVL)
- Number of active users
- Total yields distributed
- Current lottery pot size

### 4. **Community Stories**

Dedicated section with:

- User testimonials
- Case studies (anonymized)
- Community success stories
- Video interviews

### 5. **Smart Contract Explorer**

Visual interface to:

- Read contract functions
- View events
- See transaction history
- Download ABIs

### 6. **Tutorial Progress Tracker**

Users can:

- Mark tutorials as completed
- Track their learning progress
- Get completion badges

---

## 📈 Success Metrics

Track these metrics post-launch:

- [ ] **Engagement:** Time on site, pages per session
- [ ] **Search:** Top search queries (guide content creation)
- [ ] **Completion:** Tutorial completion rates
- [ ] **Languages:** English vs Spanish traffic split
- [ ] **Referrals:** Docs → App conversion rate
- [ ] **Developer:** API docs views, GitHub stars

---

## 🎯 Next Steps

1. **Approve this proposal** ✅
2. **Set up Starlight project** (30 min)
3. **Start writing content** (iterative)
4. **Deploy MVP** (Phase 1 + 2 = 3 weeks)
5. **Iterate based on user feedback**

---

## 💰 Cost Estimate

| Item                           | Cost                    |
| ------------------------------ | ----------------------- |
| Starlight Framework            | Free (open source)      |
| Hosting (Vercel)               | Free (hobby tier)       |
| Algolia DocSearch              | Free (open source)      |
| Domain (`docs.khipuvault.com`) | Included in main domain |
| Video Hosting (YouTube)        | Free                    |
| Analytics (Plausible)          | $9/month (optional)     |
| **Total Monthly Cost**         | **~$10/month**          |

---

## 🏁 Conclusion

We can build a **world-class documentation site** that's:

- ✅ Better organized than Mezo's
- ✅ More visual and interactive
- ✅ Bilingual (English + Spanish)
- ✅ Developer-friendly
- ✅ SEO optimized
- ✅ Low cost (~$10/month)

This will:

- **Reduce support burden** (users self-serve)
- **Increase conversions** (better onboarding)
- **Build trust** (transparency & education)
- **Enable integrations** (developer docs)
- **Expand reach** (Spanish-speaking users)

**Let's build it!** 🚀

---

**Generated:** 2026-02-08
**Author:** KhipuVault Team
**Status:** Ready to Implement
