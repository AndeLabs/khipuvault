/**
 * Format BigInt wei amount to human-readable string
 */
export function formatMUSD(weiAmount: string | bigint, decimals: number = 2): string {
  const amount = typeof weiAmount === 'string' ? BigInt(weiAmount) : weiAmount
  const formatted = Number(amount) / 1e18
  return formatted.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Parse human-readable MUSD amount to wei
 */
export function parseMUSD(amount: string): bigint {
  const parsed = parseFloat(amount)
  if (isNaN(parsed)) throw new Error('Invalid amount')
  return BigInt(Math.floor(parsed * 1e18))
}

/**
 * Format address to shortened version
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return ''
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`
}

/**
 * Format APR percentage
 */
export function formatAPR(apr: number, decimals: number = 2): string {
  return `${apr.toFixed(decimals)}%`
}

/**
 * Format timestamp to date string
 */
export function formatDate(timestamp: Date | number): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: Date | number): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  return 'just now'
}
