/**
 * Converts a string to a URL-friendly slug.
 */
export function toSlug(str: string): string {
  return str.toLowerCase().replace(/ /g, '-');
}

/**
 * Extracts the token from a Bearer authorization header.
 * Returns null if the header is invalid or not a Bearer token.
 */
export function extractBearerToken(header: string | undefined | null): string | null {
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7);
}
