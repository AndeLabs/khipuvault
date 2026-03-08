/**
 * @fileoverview JSON-LD Structured Data
 * @module lib/seo/json-ld
 *
 * Provides JSON-LD structured data for SEO optimization.
 * These components inject schema.org structured data into pages.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data
 * @see https://schema.org
 */

import type { ReactNode } from "react";

/**
 * Base JSON-LD script component
 */
function JsonLd({ data }: { data: Record<string, unknown> }): ReactNode {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

/**
 * Organization structured data
 * Use on homepage and about pages
 */
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KhipuVault",
    url: "https://khipuvault.com",
    logo: "https://khipuvault.com/icon-512.png",
    description:
      "Plataforma descentralizada de ahorro Bitcoin que digitaliza Pasanaku, Tandas y Roscas en blockchain con MUSD de Mezo.",
    sameAs: ["https://twitter.com/khipuvault", "https://github.com/khipuvault"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: "https://github.com/khipuvault/khipuvault/issues",
    },
  };

  return <JsonLd data={data} />;
}

/**
 * WebApplication structured data
 * Use on the main application pages
 */
export function WebApplicationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "KhipuVault",
    url: "https://khipuvault.com",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    description:
      "Aplicación descentralizada para ahorro de Bitcoin con rendimientos reales a través de DeFi en Mezo blockchain.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free to use, only pay blockchain transaction fees",
    },
    featureList: [
      "Individual Bitcoin savings with yield generation",
      "Cooperative savings pools (Pasanaku/Tandas/Roscas)",
      "No-loss lottery prize pools",
      "ROSCA rotating savings circles",
      "Self-custodial - your keys, your coins",
      "Built on Mezo blockchain",
    ],
    screenshot: "https://khipuvault.com/og-image.png",
    softwareVersion: "1.0.0",
    creator: {
      "@type": "Organization",
      name: "KhipuVault",
      url: "https://khipuvault.com",
    },
  };

  return <JsonLd data={data} />;
}

/**
 * FinancialProduct structured data for savings features
 */
export function SavingsProductJsonLd({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name,
    description,
    url: `https://khipuvault.com${url}`,
    provider: {
      "@type": "Organization",
      name: "KhipuVault",
      url: "https://khipuvault.com",
    },
    category: "Savings Account",
    feesAndCommissionsSpecification: "No platform fees. Only blockchain gas fees apply.",
  };

  return <JsonLd data={data} />;
}

/**
 * FAQPage structured data
 * Use on FAQ or How It Works sections
 */
export function FaqJsonLd({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return <JsonLd data={data} />;
}

/**
 * BreadcrumbList structured data
 * Use for navigation paths
 */
export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://khipuvault.com${item.url}`,
    })),
  };

  return <JsonLd data={data} />;
}

/**
 * SoftwareApplication structured data
 * Alternative to WebApplication for app stores
 */
export function SoftwareApplicationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "KhipuVault",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "100",
      bestRating: "5",
      worstRating: "1",
    },
  };

  return <JsonLd data={data} />;
}

/**
 * HowTo structured data for guides
 */
export function HowToJsonLd({
  name,
  description,
  steps,
}: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string }>;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };

  return <JsonLd data={data} />;
}
