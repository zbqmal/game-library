/**
 * Sanitizes a page name to ensure it's a valid Firestore field name
 * @param page - The page name to sanitize
 * @returns A sanitized page name with only alphanumeric characters, hyphens, and underscores
 */
export function sanitizePageName(page: string): string {
  return page.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * Gets the current date in EST/EDT timezone formatted as YYYY-MM-DD
 * Uses America/New_York timezone which automatically handles EST (UTC-5) and EDT (UTC-4)
 * @returns Current date string in EST/EDT timezone
 */
export function getCurrentDateEST(): string {
  const now = new Date();
  // Convert to America/New_York timezone (handles EST/EDT automatically)
  const estDate = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" }),
  );

  const year = estDate.getFullYear();
  const month = String(estDate.getMonth() + 1).padStart(2, "0");
  const day = String(estDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Checks if a new day has started in EST timezone
 * @param lastResetDate - The last reset date string (YYYY-MM-DD)
 * @returns True if a new day has started, false otherwise
 */
export function shouldResetDailyCount(
  lastResetDate: string | undefined,
): boolean {
  if (!lastResetDate) {
    return true; // Reset if no last reset date exists
  }

  const currentDate = getCurrentDateEST();
  return currentDate !== lastResetDate;
}

/**
 * Interpolates a template string with {{placeholders}} using provided values.
 */
export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce((result, [key, value]) => {
    const pattern = new RegExp(`{{${key}}}`, "g");
    return result.replace(pattern, String(value));
  }, template);
}
