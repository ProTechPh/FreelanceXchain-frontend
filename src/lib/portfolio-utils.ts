/**
 * Utility for generating live website preview screenshot URLs (Instant HD website preview)
 */
export function getWebsitePreviewUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const normalized = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;

  return `https://api.microlink.io/?url=${encodeURIComponent(normalized)}&screenshot=true&meta=false&embed=screenshot.url`;
}

/** True for a screenshot URL built by getWebsitePreviewUrl rather than an uploaded image. */
export function isWebsitePreviewUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return hostname === 'api.microlink.io' || hostname.endsWith('.microlink.io');
  } catch {
    return false;
  }
}

export function isValidHttpUrl(string?: string | null): boolean {
  if (!string) return false;
  try {
    const url = new URL(string.startsWith('http') ? string : `https://${string}`);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
