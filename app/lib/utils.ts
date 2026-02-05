/**
 * Sanitizes a page name to ensure it's a valid Firestore field name
 * @param page - The page name to sanitize
 * @returns A sanitized page name with only alphanumeric characters, hyphens, and underscores
 */
export function sanitizePageName(page: string): string {
  return page.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Gets the current date in EST timezone formatted as YYYY-MM-DD
 * @returns Current date string in EST timezone
 */
export function getCurrentDateEST(): string {
  const now = new Date();
  // Convert to EST (UTC-5)
  const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  
  const year = estDate.getFullYear();
  const month = String(estDate.getMonth() + 1).padStart(2, '0');
  const day = String(estDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a new day has started in EST timezone
 * @param lastResetDate - The last reset date string (YYYY-MM-DD)
 * @returns True if a new day has started, false otherwise
 */
export function shouldResetDailyCount(lastResetDate: string | undefined): boolean {
  if (!lastResetDate) {
    return true; // Reset if no last reset date exists
  }
  
  const currentDate = getCurrentDateEST();
  return currentDate !== lastResetDate;
}
