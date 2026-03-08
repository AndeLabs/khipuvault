/**
 * @fileoverview Color Contrast Utilities
 * @module lib/accessibility/color-contrast
 *
 * Utilities for checking WCAG color contrast compliance.
 * - WCAG AA: 4.5:1 for normal text, 3:1 for large text
 * - WCAG AAA: 7:1 for normal text, 4.5:1 for large text
 */

/**
 * WCAG contrast ratio requirements
 */
export const WCAG_CONTRAST = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3.0,
  AAA_NORMAL: 7.0,
  AAA_LARGE: 4.5,
  UI_COMPONENTS: 3.0,
} as const;

/**
 * RGB color type
 */
interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Parse a hex color to RGB
 */
function hexToRgb(hex: string): RGB | null {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, "");

  // Handle 3-digit hex
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((c) => c + c)
          .join("")
      : cleanHex;

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);

  if (!result) {
    return null;
  }

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Parse various color formats to RGB
 */
function parseColor(color: string): RGB | null {
  // Hex format
  if (color.startsWith("#")) {
    return hexToRgb(color);
  }

  // RGB format: rgb(255, 255, 255)
  const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // RGBA format: rgba(255, 255, 255, 1)
  const rgbaMatch = color.match(/rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)/i);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
    };
  }

  return null;
}

/**
 * Calculate relative luminance of a color
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(rgb: RGB): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const sRGB = channel / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(foreground: string, background: string): number | null {
  const fgRgb = parseColor(foreground);
  const bgRgb = parseColor(background);

  if (!fgRgb || !bgRgb) {
    return null;
  }

  const fgLuminance = getRelativeLuminance(fgRgb);
  const bgLuminance = getRelativeLuminance(bgRgb);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG requirements
 */
export function checkContrast(
  foreground: string,
  background: string,
  options: {
    level?: "AA" | "AAA";
    isLargeText?: boolean;
    isUIComponent?: boolean;
  } = {}
): {
  ratio: number | null;
  passes: boolean;
  level: string;
  required: number;
} {
  const { level = "AA", isLargeText = false, isUIComponent = false } = options;

  const ratio = getContrastRatio(foreground, background);

  if (ratio === null) {
    return {
      ratio: null,
      passes: false,
      level: "Unknown",
      required: 0,
    };
  }

  let required: number;
  let resultLevel: string;

  if (isUIComponent) {
    required = WCAG_CONTRAST.UI_COMPONENTS;
    resultLevel = "UI Component";
  } else if (level === "AAA") {
    required = isLargeText ? WCAG_CONTRAST.AAA_LARGE : WCAG_CONTRAST.AAA_NORMAL;
    resultLevel = `AAA ${isLargeText ? "(Large)" : "(Normal)"}`;
  } else {
    required = isLargeText ? WCAG_CONTRAST.AA_LARGE : WCAG_CONTRAST.AA_NORMAL;
    resultLevel = `AA ${isLargeText ? "(Large)" : "(Normal)"}`;
  }

  return {
    ratio,
    passes: ratio >= required,
    level: resultLevel,
    required,
  };
}

/**
 * Get all WCAG compliance levels for a color pair
 */
export function getContrastCompliance(
  foreground: string,
  background: string
): {
  ratio: number | null;
  AA_normal: boolean;
  AA_large: boolean;
  AAA_normal: boolean;
  AAA_large: boolean;
  UI_components: boolean;
} {
  const ratio = getContrastRatio(foreground, background);

  if (ratio === null) {
    return {
      ratio: null,
      AA_normal: false,
      AA_large: false,
      AAA_normal: false,
      AAA_large: false,
      UI_components: false,
    };
  }

  return {
    ratio,
    AA_normal: ratio >= WCAG_CONTRAST.AA_NORMAL,
    AA_large: ratio >= WCAG_CONTRAST.AA_LARGE,
    AAA_normal: ratio >= WCAG_CONTRAST.AAA_NORMAL,
    AAA_large: ratio >= WCAG_CONTRAST.AAA_LARGE,
    UI_components: ratio >= WCAG_CONTRAST.UI_COMPONENTS,
  };
}

/**
 * Suggest a compliant alternative color
 * Adjusts the foreground color to meet contrast requirements
 */
export function suggestCompliantColor(
  foreground: string,
  background: string,
  targetRatio: number = WCAG_CONTRAST.AA_NORMAL
): string | null {
  const fgRgb = parseColor(foreground);
  const bgRgb = parseColor(background);

  if (!fgRgb || !bgRgb) {
    return null;
  }

  const bgLuminance = getRelativeLuminance(bgRgb);

  // Determine if we need to lighten or darken
  const fgLuminance = getRelativeLuminance(fgRgb);
  const shouldLighten = fgLuminance < bgLuminance;

  // Binary search for compliant color
  let low = shouldLighten ? 0 : -255;
  let high = shouldLighten ? 255 : 0;
  let bestColor = foreground;

  for (let i = 0; i < 20; i++) {
    const mid = Math.floor((low + high) / 2);
    const adjustment = shouldLighten ? mid : -mid;

    const adjustedRgb = {
      r: Math.max(0, Math.min(255, fgRgb.r + adjustment)),
      g: Math.max(0, Math.min(255, fgRgb.g + adjustment)),
      b: Math.max(0, Math.min(255, fgRgb.b + adjustment)),
    };

    const adjustedHex = `#${adjustedRgb.r.toString(16).padStart(2, "0")}${adjustedRgb.g.toString(16).padStart(2, "0")}${adjustedRgb.b.toString(16).padStart(2, "0")}`;

    const ratio = getContrastRatio(adjustedHex, background);

    if (ratio && ratio >= targetRatio) {
      bestColor = adjustedHex;
      if (shouldLighten) {
        high = mid;
      } else {
        low = mid;
      }
    } else {
      if (shouldLighten) {
        low = mid;
      } else {
        high = mid;
      }
    }
  }

  return bestColor;
}
