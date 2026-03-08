/**
 * @fileoverview PWA Install Prompt
 * @module lib/pwa/install-prompt
 *
 * Handles the "Add to Home Screen" prompt for Progressive Web Apps.
 * Provides a React hook for managing installation state and triggering the prompt.
 */

"use client";

import { useEffect, useState } from "react";

import { logger } from "@/lib/monitoring/logger";

// ============================================================================
// TYPES
// ============================================================================

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface InstallPromptState {
  /** Whether the app can be installed */
  canInstall: boolean;
  /** Whether the app is already installed */
  isInstalled: boolean;
  /** Platform (ios, android, desktop) */
  platform: "ios" | "android" | "desktop" | "unknown";
  /** Trigger the installation prompt */
  promptInstall: () => Promise<boolean>;
  /** Dismiss the prompt permanently */
  dismissPrompt: () => void;
  /** Whether user has dismissed the prompt */
  isDismissed: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DISMISS_KEY = "khipuvault-install-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// ============================================================================
// INSTALL PROMPT HOOK
// ============================================================================

/**
 * Hook to manage PWA installation prompt
 *
 * @returns Install prompt state and controls
 *
 * @example
 * ```tsx
 * function InstallButton() {
 *   const { canInstall, promptInstall, platform } = useInstallPrompt();
 *
 *   if (!canInstall) return null;
 *
 *   return (
 *     <Button onClick={promptInstall}>
 *       Install App {platform === 'ios' && '(Add to Home Screen)'}
 *     </Button>
 *   );
 * }
 * ```
 */
export function useInstallPrompt(): InstallPromptState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop" | "unknown">("unknown");

  useEffect(() => {
    // Check if already dismissed
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil) {
      const dismissTime = parseInt(dismissedUntil, 10);
      if (Date.now() < dismissTime) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(DISMISS_KEY);
      }
    }

    // Detect platform
    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      logger.debug("App is already installed", {
        category: "general",
        source: "install-prompt",
      });
      return;
    }

    // iOS doesn't support beforeinstallprompt
    if (detectedPlatform === "ios") {
      // On iOS, show manual instructions
      logger.debug("iOS detected - manual install instructions needed", {
        category: "general",
        source: "install-prompt",
      });
      return;
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      logger.debug("Install prompt available", {
        category: "general",
        source: "install-prompt",
        metadata: { platform: detectedPlatform },
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);

      logger.info("App installed successfully", {
        category: "general",
        source: "install-prompt",
      });
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  /**
   * Trigger the installation prompt
   */
  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      logger.warn("Install prompt not available", {
        category: "general",
        source: "install-prompt",
      });
      return false;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        logger.info("User accepted install prompt", {
          category: "general",
          source: "install-prompt",
        });
        setDeferredPrompt(null);
        return true;
      } else {
        logger.debug("User dismissed install prompt", {
          category: "general",
          source: "install-prompt",
        });
        return false;
      }
    } catch (error) {
      logger.error("Failed to show install prompt", error, {
        category: "general",
        source: "install-prompt",
      });
      return false;
    }
  };

  /**
   * Dismiss the prompt for a period of time
   */
  const dismissPrompt = () => {
    const dismissUntil = Date.now() + DISMISS_DURATION;
    localStorage.setItem(DISMISS_KEY, dismissUntil.toString());
    setIsDismissed(true);

    logger.debug("Install prompt dismissed", {
      category: "general",
      source: "install-prompt",
      metadata: { dismissedFor: DISMISS_DURATION },
    });
  };

  return {
    canInstall: !isInstalled && !isDismissed && (!!deferredPrompt || platform === "ios"),
    isInstalled,
    platform,
    promptInstall,
    dismissPrompt,
    isDismissed,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Detect user's platform
 */
function detectPlatform(): "ios" | "android" | "desktop" | "unknown" {
  if (typeof window === "undefined") {
    return "unknown";
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // iOS detection
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return "ios";
  }

  // Android detection
  if (/android/i.test(userAgent)) {
    return "android";
  }

  // Desktop detection
  if (window.matchMedia("(min-width: 1024px)").matches) {
    return "desktop";
  }

  return "unknown";
}

/**
 * Check if running in standalone mode (installed as PWA)
 */
export function isStandalone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Check if PWA is installable on this device/browser
 */
export function isInstallable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // Check for Service Worker support (required for PWA)
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  // Check for manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (!manifestLink) {
    return false;
  }

  return true;
}

/**
 * Get installation instructions for iOS
 */
export function getIOSInstructions(): string[] {
  return [
    "Tap the Share button in Safari",
    'Look for "Add to Home Screen"',
    "Tap to add KhipuVault to your home screen",
  ];
}

/**
 * Check if browser supports PWA features
 */
export function checkPWASupport(): {
  serviceWorker: boolean;
  manifest: boolean;
  notifications: boolean;
  installPrompt: boolean;
} {
  if (typeof window === "undefined") {
    return {
      serviceWorker: false,
      manifest: false,
      notifications: false,
      installPrompt: false,
    };
  }

  return {
    serviceWorker: "serviceWorker" in navigator,
    manifest: !!document.querySelector('link[rel="manifest"]'),
    notifications: "Notification" in window,
    installPrompt: "BeforeInstallPromptEvent" in window || detectPlatform() === "ios",
  };
}

// ============================================================================
// LOCAL STORAGE UTILITIES
// ============================================================================

/**
 * Track installation analytics
 */
export function trackInstallation(): void {
  try {
    const installDate = new Date().toISOString();
    localStorage.setItem("khipuvault-install-date", installDate);

    logger.info("Installation tracked", {
      category: "general",
      source: "install-prompt",
      metadata: { installDate },
    });
  } catch (error) {
    logger.error("Failed to track installation", error, {
      category: "general",
      source: "install-prompt",
    });
  }
}

/**
 * Get installation date
 */
export function getInstallDate(): Date | null {
  try {
    const dateStr = localStorage.getItem("khipuvault-install-date");
    return dateStr ? new Date(dateStr) : null;
  } catch {
    return null;
  }
}
