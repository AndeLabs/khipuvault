/**
 * @fileoverview Mobile Detection and Utilities
 * @module lib/web3/mobile-utils
 *
 * Utilities for detecting mobile browsers, in-app browsers,
 * and optimizing Web3 experience for mobile devices
 */

/**
 * Detect if user is on mobile device
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * Detect if user is in MetaMask mobile browser
 */
export function isMetaMaskMobile(): boolean {
  if (typeof window === 'undefined') return false

  return (
    isMobile() &&
    typeof window.ethereum !== 'undefined' &&
    window.ethereum.isMetaMask === true
  )
}

/**
 * Detect if user is in an in-app browser (MetaMask, Trust, Coinbase, etc.)
 */
export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera

  // Check for common in-app browser patterns
  const inAppPatterns = [
    'MetaMaskMobile',
    'Trust',
    'CoinbaseBrowser',
    'BitKeep',
    'TokenPocket',
    'imToken',
  ]

  return inAppPatterns.some(pattern => ua.includes(pattern))
}

/**
 * Detect if user is on iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false

  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

/**
 * Detect if user is on Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false

  return /Android/.test(navigator.userAgent)
}

/**
 * Get device information
 */
export function getDeviceInfo() {
  return {
    isMobile: isMobile(),
    isMetaMaskMobile: isMetaMaskMobile(),
    isInAppBrowser: isInAppBrowser(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
  }
}

/**
 * Check if wallet provider is available
 * More lenient check for mobile browsers
 */
export function isWalletAvailable(): boolean {
  if (typeof window === 'undefined') return false

  // In mobile browsers, ethereum might be injected after page load
  // So we check multiple possibilities
  return !!(
    window.ethereum ||
    (window as any).web3 ||
    (window as any).metamask
  )
}

/**
 * Wait for wallet injection (mobile browsers need time)
 * @param timeout Maximum time to wait in ms
 * @returns Promise that resolves when wallet is detected
 */
export async function waitForWallet(timeout = 3000): Promise<boolean> {
  if (typeof window === 'undefined') return false

  // If already available, return immediately
  if (isWalletAvailable()) return true

  // Wait for injection (mobile browsers are slower)
  return new Promise((resolve) => {
    let elapsed = 0
    const interval = 100 // Check every 100ms

    const checkInterval = setInterval(() => {
      elapsed += interval

      if (isWalletAvailable()) {
        clearInterval(checkInterval)
        resolve(true)
      } else if (elapsed >= timeout) {
        clearInterval(checkInterval)
        resolve(false)
      }
    }, interval)
  })
}

/**
 * Get user-friendly device message
 */
export function getDeviceMessage(): string {
  const info = getDeviceInfo()

  if (info.isMetaMaskMobile) {
    return '📱 MetaMask Mobile detectado'
  }

  if (info.isInAppBrowser) {
    return '📱 Navegador in-app detectado'
  }

  if (info.isMobile) {
    return '📱 Dispositivo móvil detectado'
  }

  return '💻 Navegador desktop'
}

/**
 * Check if device needs special mobile handling
 */
export function needsMobileOptimization(): boolean {
  return isMobile() || isInAppBrowser()
}

/**
 * Log device info for debugging
 */
export function logDeviceInfo(): void {
  if (typeof window === 'undefined') return

  const info = getDeviceInfo()

  console.group('📱 Device Information')
  console.log('Mobile:', info.isMobile)
  console.log('MetaMask Mobile:', info.isMetaMaskMobile)
  console.log('In-App Browser:', info.isInAppBrowser)
  console.log('iOS:', info.isIOS)
  console.log('Android:', info.isAndroid)
  console.log('Wallet Available:', isWalletAvailable())
  console.log('User Agent:', info.userAgent)
  console.groupEnd()
}
