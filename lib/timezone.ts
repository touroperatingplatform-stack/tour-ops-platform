/**
 * Timezone utilities for consistent date handling across the app
 * 
 * Why this exists: Driver assignment component showed wrong date (March 27 instead of 28)
 * due to timezone mismatch between browser (UTC) and server (Cancun).
 * 
 * Always use these helpers instead of raw Date methods for date strings.
 * 
 * @see docs/TIMEZONE-SETTING.md for full documentation
 */

// Default timezone (Cancun - EST, no DST)
export const DEFAULT_TIMEZONE = 'America/Cancun'

/**
 * Get current date string in specified timezone
 * @param timezone - IANA timezone string (default: America/Cancun)
 * @returns Date string in YYYY-MM-DD format
 * 
 * @example
 * getLocalDate() // "2026-03-28"
 * getLocalDate('America/New_York') // "2026-03-28"
 */
export function getLocalDate(timezone: string = DEFAULT_TIMEZONE): string {
  const now = new Date()
  const tzTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  const year = tzTime.getFullYear()
  const month = String(tzTime.getMonth() + 1).padStart(2, '0')
  const day = String(tzTime.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get current datetime string in specified timezone
 * @param timezone - IANA timezone string (default: America/Cancun)
 * @returns Datetime string in YYYY-MM-DDTHH:mm:ss format
 */
export function getLocalDateTime(timezone: string = DEFAULT_TIMEZONE): string {
  const now = new Date()
  const tzTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  const year = tzTime.getFullYear()
  const month = String(tzTime.getMonth() + 1).padStart(2, '0')
  const day = String(tzTime.getDate()).padStart(2, '0')
  const hours = String(tzTime.getHours()).padStart(2, '0')
  const minutes = String(tzTime.getMinutes()).padStart(2, '0')
  const seconds = String(tzTime.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

/**
 * Convert date string to timezone-aware Date object
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timezone - IANA timezone string (default: America/Cancun)
 * @returns Date object
 */
export function toDateInTimezone(dateStr: string, timezone: string = DEFAULT_TIMEZONE): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Get user's configured timezone from settings
 * This should be called from the backend/supabase side
 * For client-side, pass timezone as prop from server component
 */
export async function getConfiguredTimezone(): Promise<string> {
  // This will be implemented in the settings page
  // For now, return default
  return DEFAULT_TIMEZONE
}
