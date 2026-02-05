/**
 * Sanitizes a page name to ensure it's a valid Firestore field name
 * @param page - The page name to sanitize
 * @returns A sanitized page name with only alphanumeric characters, hyphens, and underscores
 */
export function sanitizePageName(page: string): string {
  return page.replace(/[^a-zA-Z0-9_-]/g, '_');
}
