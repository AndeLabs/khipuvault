"use client";

import DOMPurify, { type Config } from "dompurify";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

/**
 * DOMPurify configuration for strict sanitization
 * Only allows basic formatting tags, no scripts/events/styles
 */
const PURIFY_CONFIG: Config = {
  ALLOWED_TAGS: [
    "b",
    "i",
    "em",
    "strong",
    "a",
    "p",
    "br",
    "ul",
    "ol",
    "li",
    "span",
    "div",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "code",
    "pre",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "class", "id"],
  ALLOW_DATA_ATTR: false,
  // Force all links to open in new tab with security attributes
  ADD_ATTR: ["target", "rel"],
  // Prevent JavaScript URLs
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Hook that returns sanitized HTML, callable for more advanced use cases
 */
const SANITIZE_HOOKS = {
  afterSanitizeAttributes: (node: Element) => {
    // Force all links to open in new tab with noopener noreferrer
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  },
};

export interface SafeHTMLProps {
  /** Raw HTML string to sanitize and render */
  html: string;
  /** Optional className for the container */
  className?: string;
  /** Container element type (default: div) */
  as?: "div" | "span" | "article" | "section";
  /** Custom DOMPurify config to extend defaults */
  config?: Config;
}

/**
 * SafeHTML - Securely renders untrusted HTML content
 *
 * Uses DOMPurify to sanitize HTML and prevent XSS attacks.
 * All links are automatically set to open in new tabs with noopener noreferrer.
 *
 * @example
 * ```tsx
 * <SafeHTML html={userContent} className="prose" />
 * ```
 */
export function SafeHTML({
  html,
  className,
  as: Component = "div",
  config,
}: SafeHTMLProps) {
  const sanitizedHTML = useMemo(() => {
    // Configure hooks for link security
    DOMPurify.addHook(
      "afterSanitizeAttributes",
      SANITIZE_HOOKS.afterSanitizeAttributes,
    );

    const clean = DOMPurify.sanitize(html, {
      ...PURIFY_CONFIG,
      ...config,
      RETURN_TRUSTED_TYPE: false,
    }) as string;

    // Remove hook after sanitization to avoid memory leaks
    DOMPurify.removeHook("afterSanitizeAttributes");

    return clean;
  }, [html, config]);

  return (
    <Component
      className={cn(className)}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
}

/**
 * Utility function to sanitize HTML outside of React components
 * Useful for preparing content before storing or processing
 */
export function sanitizeHTML(html: string, config?: Config): string {
  DOMPurify.addHook(
    "afterSanitizeAttributes",
    SANITIZE_HOOKS.afterSanitizeAttributes,
  );

  const clean = DOMPurify.sanitize(html, {
    ...PURIFY_CONFIG,
    ...config,
    RETURN_TRUSTED_TYPE: false,
  }) as string;

  DOMPurify.removeHook("afterSanitizeAttributes");

  return clean;
}

export default SafeHTML;
