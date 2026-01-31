/**
 * Returns current timestamp in ISO 8601 format.
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Formats a date for use in filenames (YYYY-MM-DD format).
 */
export function formatDateForFilename(date?: Date): string {
  const d = date ?? new Date();
  return d.toISOString().split('T')[0];
}
